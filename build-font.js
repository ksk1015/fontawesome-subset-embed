const fs = require('fs');
const Fontmin = require('fontmin');
const rename = require('gulp-rename');
const config = require('./config.js');

config.names = Object.assign({
	solid: [],
	regular: [],
	brands: []
}, config.names);

const fontFileNames = {
	solid: `fa-solid-900`,
	regular: `fa-regular-400`,
	brands: `fa-brands-400`
};

function createNameGlyphMap () {
	const css = fs.readFileSync(`${config.src}/css/fontawesome.css`, 'utf8');
	const map = {}
	css.replace(/\.fa\-(.+?)\:before\s*\{\s*content\:\s*"(.+?)"\s*;?\s*\}\s*/gm, (m, name, content) => {
		map[name] = String.fromCharCode(("0xf" + content.substr(1)) - 0);
	});
	return map;
}

function buildFont (callback) {
	const nameGlyphMap = createNameGlyphMap();
	const keys = Object.keys(config.names);
	let len = keys.length;
	const complete = () => {
		if (--len === 0 && callback) {
			callback();
		}
	};
	keys.forEach(key => {
		if (config.names[key].length) {
			const fileName = fontFileNames[key];
			const src = `${config.src}/webfonts/${fileName}.ttf`;
			const text = config.names[key].map(name => nameGlyphMap[name] || '').join('');
			const dist = `${config.dist}`;
			new Fontmin()
				.src(src)
				.use(rename(`${fileName}-subset.ttf`))
				.use(Fontmin.glyph({text}))
				.use(Fontmin.ttf2woff())
				.dest(dist)
				.run((err, files, stream) => {
					if (!err) {
						console.log('\u001b[32m' + `created ${dist}/${fileName}-subset.woff` + '\u001b[0m');
					}
					fs.unlink(`${config.dist}/${fileName}-subset.ttf`, err => {
						complete();
					});
					
				});
		} else {
			fs.unlink(`${config.dist}/${fileName}-subset.woff`, err => {
				complete();
			});			
		}
	});
}

module.exports = buildFont;