const data = { text: 'Hello world!' };
const { text } = data;
console.log(`${text}`);
const anotherTest = Object.entries(data);
console.log(anotherTest[0][0] ?? 'test');
