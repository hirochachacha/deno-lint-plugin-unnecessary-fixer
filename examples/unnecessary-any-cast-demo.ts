// Demonstration of the enhanced no-unnecessary-type-assertion rule
// Now detects when type assertions to 'any' are unnecessary

type User = {
  name: string;
  age: number;
  email: string;
};

const user: User = {
  name: "John",
  age: 30,
  email: "john@example.com",
};

// BEFORE: These assertions to 'any' were not detected
console.log((user as any).name); // Unnecessary - 'name' exists on User
console.log((user as any).age); // Unnecessary - 'age' exists on User
console.log((user as any).email); // Unnecessary - 'email' exists on User

// This assertion to 'any' is still OK (property doesn't exist)
console.log((user as any).address); // OK - 'address' doesn't exist on User

// Class example
class Product {
  id: number;
  title: string;
  price: number;

  constructor(id: number, title: string, price: number) {
    this.id = id;
    this.title = title;
    this.price = price;
  }

  getInfo() {
    return `${this.title} - $${this.price}`;
  }
}

const product = new Product(1, "Laptop", 999);

// BEFORE: These assertions to 'any' were not detected
console.log((product as any).id); // Unnecessary - 'id' exists on Product
console.log((product as any).title); // Unnecessary - 'title' exists on Product
console.log((product as any).price); // Unnecessary - 'price' exists on Product
console.log((product as any).getInfo()); // Unnecessary - 'getInfo' exists on Product

// This assertion to 'any' is still OK (property doesn't exist)
console.log((product as any).category); // OK - 'category' doesn't exist on Product

// Object literal with type annotation
const config: { apiUrl: string; timeout: number } = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};

// BEFORE: This assertion to 'any' was not detected
console.log((config as any).apiUrl); // Unnecessary - 'apiUrl' exists
console.log((config as any).timeout); // Unnecessary - 'timeout' exists

// This assertion to 'any' is still OK
console.log((config as any).retries); // OK - 'retries' doesn't exist

// Expected fixes:
// All assertions to 'any' where the property exists should be removed
// After fix: console.log(user.name) instead of console.log((user as any).name)
