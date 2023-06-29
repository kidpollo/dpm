import { Ordering, Table } from '../../table';
import { Backend } from '../interface';

import { ChannelCredentials, ServiceError, credentials } from '@grpc/grpc-js';
import { DerivedField, LiteralField } from '../../field';
import {
  AggregateFieldExpr,
  AggregateOperator,
  BooleanFieldExpr,
  BooleanOperator,
  FieldExpr,
  ProjectionOperator,
  Scalar,
} from '../../field_expr';
import { DpmAgentClient as DpmAgentGrpcClient } from './dpm_agent_grpc_pb';
import {
  ConnectionRequest,
  ConnectionResponse,
  Query as DpmAgentQuery,
  QueryResult,
} from './dpm_agent_pb';

type ServiceAddress = string;
type ConnectionRequestString = string;
type ConnectionId = string;

function makeDpmLiteral(literal: LiteralField<Scalar>): DpmAgentQuery.Literal {
  let makeLiteral = (x: Scalar): DpmAgentQuery.Literal => {
    const dpmLit = new DpmAgentQuery.Literal();
    if (typeof x === 'string') {
      return dpmLit.setString(x);
    } else if (typeof x === 'number') {
      return Number.isInteger(x) ? dpmLit.setI64(x) : dpmLit.setF64(x);
    } else if (typeof x === 'boolean') {
      return dpmLit.setBoolean(x);
    }

    // Must be a Date type.
    return dpmLit.setTimestamp(+x);
  };

  if (Array.isArray(literal.value)) {
    return new DpmAgentQuery.Literal().setList(
      new DpmAgentQuery.Literal.List().setValuesList(
        literal.value.map(makeLiteral)
      )
    );
  }
  return makeLiteral(literal.value);
}

function makeDpmFieldReference(field: FieldExpr): DpmAgentQuery.FieldReference {
  return new DpmAgentQuery.FieldReference().setFieldname(
    field.operands()[0].toString()
  );
}

const aggregateOperatorMap = {
  min: DpmAgentQuery.AggregateExpression.AggregateOperator.MIN,
  max: DpmAgentQuery.AggregateExpression.AggregateOperator.MAX,
  count: DpmAgentQuery.AggregateExpression.AggregateOperator.COUNT,
  countDistinct:
    DpmAgentQuery.AggregateExpression.AggregateOperator.COUNT_DISTINCT,
  avg: DpmAgentQuery.AggregateExpression.AggregateOperator.MEAN,
  avgDistinct: DpmAgentQuery.AggregateExpression.AggregateOperator.MEAN, // dpm-agent uses Ibis, which does not support distinct mean.
};

function makeDpmAggregateExpression(
  aggExpr: AggregateFieldExpr<Scalar>
): DpmAgentQuery.AggregateExpression {
  const baseField = aggExpr.operands()[0] as FieldExpr;
  const baseDpmExpr = makeDpmExpression(baseField);
  const aggOp = aggExpr.operator() as AggregateOperator;
  const dpmAggOp = aggregateOperatorMap[aggOp];
  if (dpmAggOp === undefined) {
    throw new Error(`Unsupported aggregate operation ${aggOp}`);
  }

  return new DpmAgentQuery.AggregateExpression()
    .setArgument(baseDpmExpr)
    .setOp(dpmAggOp);
}

const projectionOperatorMap = {
  day: DpmAgentQuery.DerivedExpression.ProjectionOperator.DAY,
  month: DpmAgentQuery.DerivedExpression.ProjectionOperator.MONTH,
  year: DpmAgentQuery.DerivedExpression.ProjectionOperator.YEAR,
  hour: DpmAgentQuery.DerivedExpression.ProjectionOperator.HOUR,
  minute: DpmAgentQuery.DerivedExpression.ProjectionOperator.MINUTE,
  second: DpmAgentQuery.DerivedExpression.ProjectionOperator.SECOND,
  millisecond: DpmAgentQuery.DerivedExpression.ProjectionOperator.MILLISECOND,
};

function makeDpmDerivedExpression(
  derivedField: DerivedField<Scalar, Scalar>
): DpmAgentQuery.DerivedExpression {
  const baseField = derivedField.operands()[0] as FieldExpr;
  const baseDpmExpr = makeDpmExpression(baseField);
  const projectionOp = derivedField.operator() as ProjectionOperator;
  const dpmProjectionOp = projectionOperatorMap[projectionOp];
  if (projectionOp === undefined) {
    throw new Error(`Unsupported projection operation ${projectionOp}`);
  }

  return new DpmAgentQuery.DerivedExpression()
    .setArgument(baseDpmExpr)
    .setOp(dpmProjectionOp);
}

function makeDpmExpression(field: FieldExpr): DpmAgentQuery.Expression {
  if (field instanceof LiteralField) {
    return new DpmAgentQuery.Expression().setLiteral(makeDpmLiteral(field));
  } else if (field instanceof AggregateFieldExpr) {
    return new DpmAgentQuery.Expression().setAggregate(
      makeDpmAggregateExpression(field)
    );
  } else if (field instanceof DerivedField) {
    return new DpmAgentQuery.Expression().setDerived(
      makeDpmDerivedExpression(field)
    );
  } else if (field.operator() !== 'ident') {
    throw new Error(`Unexpected field expression ${field}`);
  }
  return new DpmAgentQuery.Expression().setField(makeDpmFieldReference(field));
}

function makeDpmGroupByExpression(
  field: FieldExpr
): DpmAgentQuery.GroupByExpression {
  if (field instanceof DerivedField) {
    return new DpmAgentQuery.GroupByExpression().setDerived(
      makeDpmDerivedExpression(field)
    );
  } else if (field.operator() !== 'ident') {
    throw new Error(`Unexpected field expression in groupBy: ${field}`);
  }
  return new DpmAgentQuery.GroupByExpression().setField(
    makeDpmFieldReference(field)
  );
}

function makeDpmSelectExpression(
  field: FieldExpr
): DpmAgentQuery.SelectExpression {
  const selectExpr = new DpmAgentQuery.SelectExpression().setArgument(
    makeDpmExpression(field)
  );
  if (field.alias !== undefined) {
    return selectExpr.setAlias(field.alias);
  }
  return selectExpr;
}

const booleanOperatorMap = {
  and: DpmAgentQuery.BooleanExpression.BooleanOperator.AND,
  or: DpmAgentQuery.BooleanExpression.BooleanOperator.OR,
  eq: DpmAgentQuery.BooleanExpression.BooleanOperator.EQ,
  neq: DpmAgentQuery.BooleanExpression.BooleanOperator.NEQ,
  gt: DpmAgentQuery.BooleanExpression.BooleanOperator.GT,
  gte: DpmAgentQuery.BooleanExpression.BooleanOperator.GTE,
  lt: DpmAgentQuery.BooleanExpression.BooleanOperator.LT,
  lte: DpmAgentQuery.BooleanExpression.BooleanOperator.LTE,
  like: DpmAgentQuery.BooleanExpression.BooleanOperator.LIKE,
  between: DpmAgentQuery.BooleanExpression.BooleanOperator.BETWEEN,
  in: DpmAgentQuery.BooleanExpression.BooleanOperator.IN,
  // TODO(PAT-3175, PAT-3176): Define once we support unary not.
  not: undefined,
  // TODO(PAT-3355): Remove `inPast` once we redefine it in terms of a `between` check.
  inPast: undefined,
  isNull: DpmAgentQuery.BooleanExpression.BooleanOperator.IS_NULL,
  isNotNull: DpmAgentQuery.BooleanExpression.BooleanOperator.IS_NOT_NULL,
};

function makeDpmBooleanExpression(
  filter: BooleanFieldExpr
): DpmAgentQuery.BooleanExpression {
  const BooleanOperator = DpmAgentQuery.BooleanExpression.BooleanOperator;
  let op = filter.operator();
  if (op === 'and' || op === 'or') {
    const args = filter.operands().map((expr) => {
      const boolExpr = makeDpmBooleanExpression(expr as BooleanFieldExpr);
      return new DpmAgentQuery.Expression().setCondition(boolExpr);
    });
    return new DpmAgentQuery.BooleanExpression()
      .setOp(booleanOperatorMap[op])
      .setArgumentsList(args);
  }

  const dpmBooleanOp = booleanOperatorMap[op as BooleanOperator];
  if (dpmBooleanOp === undefined) {
    throw new Error(`Unhandled boolean operator ${op}`);
  }

  const args = filter
    .operands()
    .map((expr) => makeDpmExpression(expr as FieldExpr));
  return new DpmAgentQuery.BooleanExpression()
    .setOp(dpmBooleanOp)
    .setArgumentsList(args);
}

function makeDpmOrderByExpression(
  ordering: Ordering
): DpmAgentQuery.OrderByExpression {
  const [fieldExpr, direction] = ordering;
  return new DpmAgentQuery.OrderByExpression()
    .setArgument(makeDpmExpression(fieldExpr))
    .setDirection(
      direction === 'ASC'
        ? DpmAgentQuery.OrderByExpression.Direction.ASC
        : DpmAgentQuery.OrderByExpression.Direction.DESC
    );
}

/**
 * DpmAgentClient uses a gRPC client to compile and execute queries against a
 * specific source connection that's provided at construction time. E.g., a
 * connection to a Snowflake DB.
 */
export class DpmAgentClient implements Backend {
  /**
   * Makes a query message from the table expression to send to dpm-agent.
   * @param query Table expression
   * @returns Query RPC message to send to dpm-agent.
   */
  private async makeDpmAgentQuery(query: Table): Promise<DpmAgentQuery> {
    const dpmAgentQuery = new DpmAgentQuery();
    dpmAgentQuery.setConnectionid(await this.connectionId);
    dpmAgentQuery.setSelectfrom(query.name);

    const {
      filterExpr: filter,
      selection,
      ordering: orderBy,
      limitTo: limit,
    } = query;
    const selections = selection?.map(makeDpmSelectExpression);
    if (selections) {
      dpmAgentQuery.setSelectList(selections);
    }

    // Process filter.
    if (filter) {
      dpmAgentQuery.setFilter(makeDpmBooleanExpression(filter));
    }

    // Process any groupings defined in selection.
    if (
      selection?.findIndex(
        (fieldExpr) => fieldExpr instanceof AggregateFieldExpr
      ) !== -1
    ) {
      const grouping = selection?.filter(
        (fieldExpr) => !(fieldExpr instanceof AggregateFieldExpr)
      );
      if (grouping) {
        dpmAgentQuery.setGroupbyList(grouping.map(makeDpmGroupByExpression));
      }
    }

    // Process orderBy.
    if (orderBy !== undefined && orderBy.length > 0) {
      const dpmOrderings = orderBy.map(makeDpmOrderByExpression);
      dpmAgentQuery.setOrderbyList(dpmOrderings);
    }

    if (limit > 0) {
      dpmAgentQuery.setLimit(limit);
    }

    return Promise.resolve(dpmAgentQuery);
  }

  constructor(
    private client: DpmAgentGrpcClient,
    private connectionId: Promise<ConnectionId>
  ) {}

  /**
   * Compiles table expression using dpm-agent.
   * @param query Table expression to compile.
   * @returns Promise that resolves to the compiled query string obtained from
   * dpm-agent, or rejects on error.
   */
  async compile(query: Table): Promise<string> {
    const dpmAgentQuery = await this.makeDpmAgentQuery(query);
    dpmAgentQuery.setDryrun(true);
    return new Promise((resolve, reject) => {
      this.client.executeQuery(
        dpmAgentQuery,
        (error: ServiceError | null, response: QueryResult) => {
          if (error) {
            console.log('dpm-agent client: Error compiling query...', error);
            reject(new Error('Error compiling query', { cause: error }));
          } else {
            resolve(response.getQuerystring());
          }
        }
      );
    });
  }

  /**
   * Executes table expression using dpm-agent.
   * @param query Table expression to execute.
   * @returns Promise that resolves to the executed query results obtained from
   * dpm-agent, or rejects on error.
   */
  async execute<Row>(query: Table): Promise<Row[]> {
    const dpmAgentQuery = await this.makeDpmAgentQuery(query);
    return new Promise((resolve, reject) => {
      this.client.executeQuery(
        dpmAgentQuery,
        (error: ServiceError | null, response: QueryResult) => {
          if (error) {
            console.log('dpm-agent client: Error executing query...', error);
            reject(new Error('Error executing query', { cause: error }));
          } else {
            let jsonData: Row[] = [];
            try {
              jsonData = JSON.parse(response.getJsondata());
            } catch (e) {
              console.log('dpm-agent: Error parsing results', e);
              reject(new Error('Error parsing JSON', { cause: e }));
            }
            resolve(jsonData);
          }
        }
      );
    });
  }
}

/**
 * A dpm-agent gRPC client container that caches its execution backend
 * connection ids, so we only create a single connection for a given execution
 * backend, identity, and creds.
 */
class DpmAgentGrpcClientContainer {
  readonly client: DpmAgentGrpcClient;
  private connectionIdForRequest: {
    [key: ConnectionRequestString]: Promise<ConnectionId>;
  } = {};

  constructor(client: DpmAgentGrpcClient) {
    this.client = client;
  }

  /**
   * Creates a connection to an execution backend, if one does not exist, and
   * caches the connection id.  Returns the connection id obtained from
   * `dpm-agent`.
   * @param connectionRequest
   * @returns
   */
  connect(connectionRequest: ConnectionRequest): Promise<ConnectionId> {
    const reqStr: ConnectionRequestString = Buffer.from(
      connectionRequest.serializeBinary()
    ).toString('base64');
    if (!(reqStr in this.connectionIdForRequest)) {
      this.connectionIdForRequest[reqStr] = new Promise((resolve, reject) => {
        this.client.createConnection(
          connectionRequest,
          (error: ServiceError | null, response: ConnectionResponse) => {
            if (error) {
              console.log('dpm-agent client: Error connecting...', error);
              reject(new Error('Error connecting', { cause: error }));
            } else {
              console.log(
                `dpm-agent client: Connected, connection id: ${response.getConnectionid()}`
              );
              const connectionId = response.getConnectionid();
              resolve(connectionId);
            }
          }
        );
      });
    }
    return this.connectionIdForRequest[reqStr];
  }
}

// A cache of gRPC client containers keyed by service address so we create a
// single client per service address.
let gRpcClientForAddress: {
  [key: ServiceAddress]: DpmAgentGrpcClientContainer;
} = {};

/**
 * A factory for creating DpmAgentClient instances that share a single gRPC client to a
 * given service address, and a single execution backend connection for a given
 * set of identities and credentials.
 *
 * @param dpmAgentServiceAddress
 * @param creds
 * @param connectionRequest
 * @returns A DpmAgentClient instance.
 */
export function makeClient({
  dpmAgentServiceAddress,
  creds = credentials.createInsecure(),
  connectionRequest,
}: {
  dpmAgentServiceAddress: ServiceAddress;
  creds?: ChannelCredentials;
  connectionRequest: ConnectionRequest;
}): DpmAgentClient {
  let clientContainer: DpmAgentGrpcClientContainer;
  if (dpmAgentServiceAddress in gRpcClientForAddress) {
    clientContainer = gRpcClientForAddress[dpmAgentServiceAddress];
  } else {
    console.log('Attempting to connect to', dpmAgentServiceAddress);
    const gRpcClient = new DpmAgentGrpcClient(dpmAgentServiceAddress, creds);
    clientContainer = new DpmAgentGrpcClientContainer(gRpcClient);
    gRpcClientForAddress[dpmAgentServiceAddress] = clientContainer;
  }

  const connectionId = clientContainer.connect(connectionRequest);
  return new DpmAgentClient(clientContainer.client, connectionId);
}
