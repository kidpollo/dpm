from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ClientVersion(_message.Message):
    __slots__ = ["client", "codeVersion", "datasetVersion"]
    class Client(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = []
    CLIENT_FIELD_NUMBER: _ClassVar[int]
    CODEVERSION_FIELD_NUMBER: _ClassVar[int]
    CSHARP: ClientVersion.Client
    DATASETVERSION_FIELD_NUMBER: _ClassVar[int]
    DPM: ClientVersion.Client
    NODE_JS: ClientVersion.Client
    PYTHON: ClientVersion.Client
    client: ClientVersion.Client
    codeVersion: str
    datasetVersion: str
    def __init__(self, client: _Optional[_Union[ClientVersion.Client, str]] = ..., datasetVersion: _Optional[str] = ..., codeVersion: _Optional[str] = ...) -> None: ...

class Query(_message.Message):
    __slots__ = ["clientVersion", "dryRun", "filter", "groupBy", "id", "limit", "orderBy", "select", "selectFrom", "type"]
    class Type(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = []
    class AggregateExpression(_message.Message):
        __slots__ = ["argument", "op"]
        class AggregateOperator(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = []
        ARGUMENT_FIELD_NUMBER: _ClassVar[int]
        COUNT: Query.AggregateExpression.AggregateOperator
        COUNT_DISTINCT: Query.AggregateExpression.AggregateOperator
        MAX: Query.AggregateExpression.AggregateOperator
        MEAN: Query.AggregateExpression.AggregateOperator
        MEDIAN: Query.AggregateExpression.AggregateOperator
        MIN: Query.AggregateExpression.AggregateOperator
        OP_FIELD_NUMBER: _ClassVar[int]
        SUM: Query.AggregateExpression.AggregateOperator
        argument: Query.Expression
        op: Query.AggregateExpression.AggregateOperator
        def __init__(self, op: _Optional[_Union[Query.AggregateExpression.AggregateOperator, str]] = ..., argument: _Optional[_Union[Query.Expression, _Mapping]] = ...) -> None: ...
    class BooleanExpression(_message.Message):
        __slots__ = ["arguments", "op"]
        class BooleanOperator(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = []
        AND: Query.BooleanExpression.BooleanOperator
        ARGUMENTS_FIELD_NUMBER: _ClassVar[int]
        BETWEEN: Query.BooleanExpression.BooleanOperator
        EQ: Query.BooleanExpression.BooleanOperator
        GT: Query.BooleanExpression.BooleanOperator
        GTE: Query.BooleanExpression.BooleanOperator
        IN: Query.BooleanExpression.BooleanOperator
        IS_NOT_NULL: Query.BooleanExpression.BooleanOperator
        IS_NULL: Query.BooleanExpression.BooleanOperator
        LIKE: Query.BooleanExpression.BooleanOperator
        LT: Query.BooleanExpression.BooleanOperator
        LTE: Query.BooleanExpression.BooleanOperator
        NEQ: Query.BooleanExpression.BooleanOperator
        OP_FIELD_NUMBER: _ClassVar[int]
        OR: Query.BooleanExpression.BooleanOperator
        arguments: _containers.RepeatedCompositeFieldContainer[Query.Expression]
        op: Query.BooleanExpression.BooleanOperator
        def __init__(self, op: _Optional[_Union[Query.BooleanExpression.BooleanOperator, str]] = ..., arguments: _Optional[_Iterable[_Union[Query.Expression, _Mapping]]] = ...) -> None: ...
    class DerivedExpression(_message.Message):
        __slots__ = ["argument", "op"]
        class ProjectionOperator(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = []
        ARGUMENT_FIELD_NUMBER: _ClassVar[int]
        DATE: Query.DerivedExpression.ProjectionOperator
        DAY: Query.DerivedExpression.ProjectionOperator
        HOUR: Query.DerivedExpression.ProjectionOperator
        MILLISECOND: Query.DerivedExpression.ProjectionOperator
        MINUTE: Query.DerivedExpression.ProjectionOperator
        MONTH: Query.DerivedExpression.ProjectionOperator
        OP_FIELD_NUMBER: _ClassVar[int]
        SECOND: Query.DerivedExpression.ProjectionOperator
        TIME: Query.DerivedExpression.ProjectionOperator
        YEAR: Query.DerivedExpression.ProjectionOperator
        argument: Query.Expression
        op: Query.DerivedExpression.ProjectionOperator
        def __init__(self, op: _Optional[_Union[Query.DerivedExpression.ProjectionOperator, str]] = ..., argument: _Optional[_Union[Query.Expression, _Mapping]] = ...) -> None: ...
    class Expression(_message.Message):
        __slots__ = ["aggregate", "condition", "derived", "field", "literal"]
        AGGREGATE_FIELD_NUMBER: _ClassVar[int]
        CONDITION_FIELD_NUMBER: _ClassVar[int]
        DERIVED_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        LITERAL_FIELD_NUMBER: _ClassVar[int]
        aggregate: Query.AggregateExpression
        condition: Query.BooleanExpression
        derived: Query.DerivedExpression
        field: Query.FieldReference
        literal: Query.Literal
        def __init__(self, field: _Optional[_Union[Query.FieldReference, _Mapping]] = ..., literal: _Optional[_Union[Query.Literal, _Mapping]] = ..., derived: _Optional[_Union[Query.DerivedExpression, _Mapping]] = ..., aggregate: _Optional[_Union[Query.AggregateExpression, _Mapping]] = ..., condition: _Optional[_Union[Query.BooleanExpression, _Mapping]] = ...) -> None: ...
    class FieldReference(_message.Message):
        __slots__ = ["fieldName"]
        FIELDNAME_FIELD_NUMBER: _ClassVar[int]
        fieldName: str
        def __init__(self, fieldName: _Optional[str] = ...) -> None: ...
    class GroupByExpression(_message.Message):
        __slots__ = ["derived", "field"]
        DERIVED_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        derived: Query.DerivedExpression
        field: Query.FieldReference
        def __init__(self, field: _Optional[_Union[Query.FieldReference, _Mapping]] = ..., derived: _Optional[_Union[Query.DerivedExpression, _Mapping]] = ...) -> None: ...
    class Id(_message.Message):
        __slots__ = ["packageId", "sourceId"]
        PACKAGEID_FIELD_NUMBER: _ClassVar[int]
        SOURCEID_FIELD_NUMBER: _ClassVar[int]
        packageId: str
        sourceId: str
        def __init__(self, packageId: _Optional[str] = ..., sourceId: _Optional[str] = ...) -> None: ...
    class Literal(_message.Message):
        __slots__ = ["boolean", "f32", "f64", "i32", "i64", "list", "string", "timestamp", "ui32", "ui64"]
        class List(_message.Message):
            __slots__ = ["values"]
            VALUES_FIELD_NUMBER: _ClassVar[int]
            values: _containers.RepeatedCompositeFieldContainer[Query.Literal]
            def __init__(self, values: _Optional[_Iterable[_Union[Query.Literal, _Mapping]]] = ...) -> None: ...
        BOOLEAN_FIELD_NUMBER: _ClassVar[int]
        F32_FIELD_NUMBER: _ClassVar[int]
        F64_FIELD_NUMBER: _ClassVar[int]
        I32_FIELD_NUMBER: _ClassVar[int]
        I64_FIELD_NUMBER: _ClassVar[int]
        LIST_FIELD_NUMBER: _ClassVar[int]
        STRING_FIELD_NUMBER: _ClassVar[int]
        TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
        UI32_FIELD_NUMBER: _ClassVar[int]
        UI64_FIELD_NUMBER: _ClassVar[int]
        boolean: bool
        f32: float
        f64: float
        i32: int
        i64: int
        list: Query.Literal.List
        string: str
        timestamp: int
        ui32: int
        ui64: int
        def __init__(self, string: _Optional[str] = ..., boolean: bool = ..., ui32: _Optional[int] = ..., ui64: _Optional[int] = ..., i32: _Optional[int] = ..., i64: _Optional[int] = ..., f32: _Optional[float] = ..., f64: _Optional[float] = ..., timestamp: _Optional[int] = ..., list: _Optional[_Union[Query.Literal.List, _Mapping]] = ...) -> None: ...
    class OrderByExpression(_message.Message):
        __slots__ = ["argument", "direction"]
        class Direction(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = []
        ARGUMENT_FIELD_NUMBER: _ClassVar[int]
        ASC: Query.OrderByExpression.Direction
        DESC: Query.OrderByExpression.Direction
        DIRECTION_FIELD_NUMBER: _ClassVar[int]
        argument: Query.Expression
        direction: Query.OrderByExpression.Direction
        def __init__(self, argument: _Optional[_Union[Query.Expression, _Mapping]] = ..., direction: _Optional[_Union[Query.OrderByExpression.Direction, str]] = ...) -> None: ...
    class SelectExpression(_message.Message):
        __slots__ = ["alias", "argument"]
        ALIAS_FIELD_NUMBER: _ClassVar[int]
        ARGUMENT_FIELD_NUMBER: _ClassVar[int]
        alias: str
        argument: Query.Expression
        def __init__(self, argument: _Optional[_Union[Query.Expression, _Mapping]] = ..., alias: _Optional[str] = ...) -> None: ...
    CLIENTVERSION_FIELD_NUMBER: _ClassVar[int]
    DATA: Query.Type
    DRYRUN_FIELD_NUMBER: _ClassVar[int]
    FILTER_FIELD_NUMBER: _ClassVar[int]
    GROUPBY_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    INTROSPECTION: Query.Type
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    ORDERBY_FIELD_NUMBER: _ClassVar[int]
    SELECTFROM_FIELD_NUMBER: _ClassVar[int]
    SELECT_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    clientVersion: ClientVersion
    dryRun: bool
    filter: Query.BooleanExpression
    groupBy: _containers.RepeatedCompositeFieldContainer[Query.GroupByExpression]
    id: Query.Id
    limit: int
    orderBy: _containers.RepeatedCompositeFieldContainer[Query.OrderByExpression]
    select: _containers.RepeatedCompositeFieldContainer[Query.SelectExpression]
    selectFrom: str
    type: Query.Type
    def __init__(self, id: _Optional[_Union[Query.Id, _Mapping]] = ..., selectFrom: _Optional[str] = ..., select: _Optional[_Iterable[_Union[Query.SelectExpression, _Mapping]]] = ..., filter: _Optional[_Union[Query.BooleanExpression, _Mapping]] = ..., groupBy: _Optional[_Iterable[_Union[Query.GroupByExpression, _Mapping]]] = ..., orderBy: _Optional[_Iterable[_Union[Query.OrderByExpression, _Mapping]]] = ..., limit: _Optional[int] = ..., dryRun: bool = ..., clientVersion: _Optional[_Union[ClientVersion, _Mapping]] = ..., type: _Optional[_Union[Query.Type, str]] = ...) -> None: ...

class QueryResult(_message.Message):
    __slots__ = ["jsonData", "queryString"]
    JSONDATA_FIELD_NUMBER: _ClassVar[int]
    QUERYSTRING_FIELD_NUMBER: _ClassVar[int]
    jsonData: str
    queryString: str
    def __init__(self, queryString: _Optional[str] = ..., jsonData: _Optional[str] = ...) -> None: ...
