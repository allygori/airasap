const fs = require('fs');

// const data = { name: 'Bob', age: 25 };
// const filePath = './output.json';

// fs.writeFile(filePath, jsonString, 'utf8', (err: any) => {
//   if (err) {
//     console.error(
//       'An error occurred while writing the JSON file:',
//       err
//     );
//     return;
//   }
//   console.log('JSON file has been saved successfully.');
// });

export const saveJson = (filePath: string, data: any) => {
  // Serialize data into formatted text string
  const jsonString = JSON.stringify(data, null, 2);

  fs.writeFile(filePath, jsonString, 'utf8', (err: any) => {
    if (err) {
      console.error(
        'An error occurred while writing the JSON file:',
        err
      );
      return;
    }
    console.log('JSON file has been saved successfully.');
  });
};
