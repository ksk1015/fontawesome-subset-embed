const buildFont = require('./build-font.js');
const buildCss = require('./build-css.js');

buildFont(() => {
	buildCss();
});