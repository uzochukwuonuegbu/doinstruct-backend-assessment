import { validateEmployees } from "./employee.validator";
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Validate Employees function", () => {
  it("should validate employees correctly", () => {
    const employees = [
      { employeeId: "123", firstName: "John", lastName: "Doe" },
      { employeeId: "123", firstName: "Jane", lastName: "Doe" }, // Duplicate ID
      { employeeId: "456", firstName: "", lastName: "Smith" }, // Missing First Name
      { employeeId: "789", firstName: "Alice", lastName: "" }, // Missing Last Name
    ];
  
    const { validEmployees, errors } = validateEmployees(employees);
  
    assert.strictEqual(validEmployees.length, 1);
    assert.strictEqual(errors.length, 3);
    assert.ok(errors.includes("Duplicate Employee ID: 123"));
    assert.ok(errors.includes("Employee ID: 456 - First Name is required"));
    assert.ok(errors.includes("Employee ID: 789 - Last Name is required"));
  });

  it("should return empty errors for valid employees", () => {
    const employees = [
      { employeeId: "001", firstName: "Tom", lastName: "Hardy" },
      { employeeId: "002", firstName: "Emma", lastName: "Watson" },
    ];
  
    const { validEmployees, errors } = validateEmployees(employees);
  
    assert.strictEqual(validEmployees.length, 2);
    assert.strictEqual(errors.length, 0);
  });

  it("should return an error for missing employeeId", () => {
    const employees = [
      { employeeId: "", firstName: "Tom", lastName: "Hardy" },
    ];
  
    const { validEmployees, errors } = validateEmployees(employees);
  
    assert.strictEqual(validEmployees.length, 0);
    assert.ok(errors.includes("Employee ID: Unknown - Employee ID is required"));
  });
});
