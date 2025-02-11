import { randomUUID } from "crypto";

const firstNames = ["John", "Jane", "Alice", "Bob", "Charlie", "Dave", "Eve", "Grace", "Hank", "Ivy"];
const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis", "Wilson", "Moore", "Taylor"];

const generatePhoneNumber = () => `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
const uniquePhoneNumbers = Array.from({ length: 10 }, generatePhoneNumber); // 10 unique phone numbers
const uniqueEmployeeIds = Array.from({ length: 10 }, randomUUID); // 10 unique employee IDs

const employees = [];

// Generate 70 unique employees
for (let i = 0; i < 70; i++) {
  employees.push({
    employeeId: randomUUID(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    phoneNumber: generatePhoneNumber(),
  });
}

// Add 10 employees with duplicate phone numbers
for (let i = 0; i < 10; i++) {
  employees.push({
    employeeId: randomUUID(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    phoneNumber: uniquePhoneNumbers[i], // Using a repeated phone number
  });
}

// Add 10 employees with empty phone numbers
for (let i = 0; i < 10; i++) {
  employees.push({
    employeeId: randomUUID(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    phoneNumber: "", // Empty phone number
  });
}

// Add 10 employees with duplicate employee IDs
for (let i = 0; i < 10; i++) {
  employees.push({
    employeeId: uniqueEmployeeIds[i], // Using a repeated employee ID
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    phoneNumber: generatePhoneNumber(),
  });
}

console.log(JSON.stringify(employees, null, 2));