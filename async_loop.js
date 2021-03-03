const fs = require('fs');

const util = require('util');

const stat = util.promisify(fs.stat);

let data = [];

async function* itr(n)
{
  let i = 0;

  while(i < n)
    yield i++;
}

setImmediate(async function()
{
    let i = 0;

    for await (i of itr(3))
    {
        data.push(await (await stat('./app.js')).size);
    }

    console.log(data);
});