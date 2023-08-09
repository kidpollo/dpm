mod integration_test {
    pub mod nodejs;
    pub mod python;
    pub mod target_tester;
}

use std::env;
use std::fs::{self};
use std::path::PathBuf;

use integration_test::nodejs::Nodejs;
use integration_test::python::Python;
use integration_test::target_tester::{describe_snowflake, TargetTester};

fn startup() -> std::io::Result<()> {
    let path = PathBuf::from("./tests/resources/generated/");
    fs::create_dir_all(&path)?;
    Ok(())
}

#[test]
fn test_nodejs() {
    test_target(Nodejs {});
}

#[test]
fn test_python() {
    test_target(Python {});
}

fn test_target(tester: impl TargetTester) {
    let curr_dir = env::current_dir().expect("Failed to get current directory");

    startup().expect("failed to generate directories");
    describe_snowflake(&curr_dir);

    tester.build_packages(&curr_dir);
    tester.install_packages(&curr_dir);
    tester.test_packages(&curr_dir);
}
