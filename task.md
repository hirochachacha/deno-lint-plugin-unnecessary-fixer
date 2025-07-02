# rules

## no-unnecessary-type-conversion

### incorrect
```
String('123'); // should be `'123'`
'123'.toString(); // should be `'123'`
'' + '123'; // should be `'123'`
'123' + ''; // should be `'123'`

Number(123); // should be `123`
+123; // should be `123`
~~123; // should be `123`

Boolean(true); // should be `true`
!!true; // should be `true`

BigInt(BigInt(1)); // should be `BigInt(1)`

let str = '123';
str += ''; // should be deleted
```

# correct
```
function foo(bar: string | number) {
  String(bar);
  bar.toString();
  '' + bar;
  bar + '';

  Number(bar);
  +bar;
  ~~bar;

  Boolean(bar);
  !!bar;

  BigInt(1);

  bar += '';
}
```

## no-unnecessary-boolean-literal-compare

### incorrect
```
```
declare const someCondition: boolean;
if (someCondition === true) { // should be `if (someCondition) {`
}

if (someCondition !== true) { // should be `if (!someCondition) {`
}

if (someCondition === false) { // should be `if (!someCondition) {`
}

if (someCondition !== false) { // should be `if (someCondition) {`
}
```

### correct
```
declare const someCondition: boolean;
if (someCondition) {
}

declare const someObjectBoolean: boolean | Record<string, unknown>;
if (someObjectBoolean === true) {
}

declare const someStringBoolean: boolean | string;
if (someStringBoolean === true) {
}
```

## no-unnecessary-type-assertion

### incorrect
```
```
const foo = 3;
const bar = foo!; // should be `const bar = foo;`
```

```
const foo = <number>(3 + 5); // should be `const foo = 3 + 5;`
```

```
type Foo = number;
const foo = <Foo>(3 + 5); // should be `const foo = 3 + 5;`
```

```
type Foo = number;
const foo = (3 + 5) as Foo; // should be `const foo = 3 + 5;`
```

```
function foo(x: number): number {
  return x!; // should be `return x;`
}
```

```
type A = {a: string};
interface IA {
  a: string;
}
const a: A = {a: "test"};
console.log((a as A).a); // should be `console.log(a.a);`
console.log((a as IA).a); // should be `console.log(a.a);`
console.log((a as any).a); // should be `console.log(a.a);`
```

```
class B { b: string; constructor() { this.b = "test"; } }
interface IB {
  b: string;
}
const b = new B();
console.log((b as B).b); // should be `console.log(b.b);`
console.log((b as IB).b); // should be `console.log(b.b);`
console.log((b as any).b); // should be `console.log(b.b);`
```

# correct
```
const foo = <number>3;
```

```
const foo = 3 as number;
```

```
let foo = 'foo' as const;
```

```
function foo(x: number | undefined): number {
  return x!;
}
```



