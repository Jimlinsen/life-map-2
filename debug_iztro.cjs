const { astro } = require('iztro');
const chartM = astro.bySolar('1990-05-15', 3, 'male');
const chartF = astro.bySolar('1990-05-15', 3, 'female');
console.log('Male chart gender:', chartM.gender);
console.log('Female chart gender:', chartF.gender);
