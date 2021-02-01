function purify(str)
{
  let aux = "";

  for(let i = 0; i < str.length; i++)
  {
    if(aux)
    {
      if(str[i] != "'")
        aux += str[i];
      else
        aux += "''";
    }  
    else
    {
      if(str[i] != "'")
        aux = str[i];
      else
        aux = "''";
    }
  }

  return aux;
}

let COL = {"TOKEN": "'", "N":2, "M":"'"};
let keys = Object.keys(COL);

  for(var i = 0; i < keys.length; i++)
  {
    if(keys[i] != "TARGET" && keys[i] != "TOKEN" && isNaN(COL[keys[i]]))
      COL[keys[i]] = purify(COL[keys[i]]);
  }

  console.log(COL);
  