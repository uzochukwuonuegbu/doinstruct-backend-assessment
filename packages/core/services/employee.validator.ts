import { randomUUID } from "crypto";
import {
    isValidPhoneNumber,
  } from 'libphonenumber-js'

const firstNames = ["John", "Jane", "Alice", "Bob"];
const lastNames = ["Doe", "Smith", "Johnson", "Williams"];

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export function generateEmployees(count: number): Employee[] {
  return Array.from({ length: count }, () => ({
    employeeId: randomUUID(), // Unique ID
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    phoneNumber: Math.random() > 0.5 ? `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
  }));
}

export function validateEmployees(employees: Employee[]): { validEmployees: Employee[]; errors: string[] } {
    const errors: string[] = [];
    const validatedEmployees: Employee[] = [];
    const employeeIdSet = new Set<string>();
  
    for (const employee of employees) {
      const errorsForEmployee: string[] = [];
  
      if (!employee.employeeId) {
        errorsForEmployee.push("Employee ID is required");
      } else {
        if (employeeIdSet.has(employee.employeeId)) {
          errorsForEmployee.push(`Duplicate Employee ID: ${employee.employeeId}`);
        } else {
          employeeIdSet.add(employee.employeeId);
        }
      }
      
      if (!employee.firstName) errorsForEmployee.push("First Name is required");
      if (!employee.lastName) errorsForEmployee.push("Last Name is required");
      if (employee.phoneNumber) {
        if(!isValidPhoneNumber(employee.phoneNumber)) errorsForEmployee.push("Invalid Phone Number");
      } else {
        delete employee.phoneNumber
      }
  
      if (errorsForEmployee.length > 0) {
        errors.push(`Employee ID: ${employee.employeeId || "Unknown"} - ${errorsForEmployee.join(", ")}`);
      } else {
        validatedEmployees.push(employee);
      }
    }
  
    return { validEmployees: validatedEmployees, errors };
  }