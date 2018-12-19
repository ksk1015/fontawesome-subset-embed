const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const config = require('./config.js');

config.names = Object.assign({
	solid: [],
	regular: [],
	brands: []
}, config.names);

// remove nnnecessary icons
function subsetFontawesomeCss (css) {
	const allNames = [
		...config.names.solid,
		...config.names.regular,
		...config.names.brands
	].filter((x, i, self) => self.indexOf(x) === i);

	return css.replace(/\.fa\-(.+?)\:before\s*\{\s*content\:\s*"(.+?)"\s*;?\s*\}\s*/gm, (m, name) => {
		return allNames.includes(name) ? m : ''
	});
}

// src: url... → src: url("fa-solid-900-subset.woff") format("woff"), 
function subsetFontFaceCss (css) {
	css = css.replace(/\/\*(.|\n)+?\*\/\s/gm, ''); // remove comment
	css = css.replace(/src\:\s*url\("?.+?\.eot"?\);?\s*/gm, ''); // remove old ie src
	css = css.replace(/(src\:\s*)(.+?)(;|\})/gm, (m, m1, m2, m3) => {
		let woff = m2.split(',').find(item => item.indexOf('format("woff")') >= 0); // only woff
		woff = woff.replace(/url\(\"?(.+?)\"?\)/, (m, url) => { // change path
			const basename = path.basename(url, '.woff');
			return `url(${basename}-subset.woff)`;
		});
		return m1 + woff + m3;
	});
	return css;
}

function embedFont (css) {
	return css.replace(/@font\-face\s*\{([\s\S]+?)\}/gm, fontFace => {
		return fontFace.replace(/url\(\"?(.+?)\"?\)/gm, (m, url) => {
			const fontPath = path.resolve(__dirname, config.dist, url);
			const buffer = fs.readFileSync(fontPath);
			const base64 = buffer.toString('base64');
			return `url("data:application/x-font-woff;charset=utf-8;base64,${base64}")`;
		});
	});
}

function writeCss (path, css) {
	fs.writeFile(path, css, err => {
		if (!err) console.log('\u001b[32m' + 'created ' + path + '\u001b[0m');
	})
}

function buildCss () {
	const fontawesomeCss = fs.readFileSync(`${config.src}/css/fontawesome.css`, 'utf8');
	const solidCss = fs.readFileSync(`${config.src}/css/solid.css`, 'utf8');
	const regularCss = fs.readFileSync(`${config.src}/css/regular.css`, 'utf8');
	const brandsCss = fs.readFileSync(`${config.src}/css/brands.css`, 'utf8');

	const fontawesomeCssSubset = subsetFontawesomeCss(fontawesomeCss);
	const solidCssSubset = config.names.solid.length ? subsetFontFaceCss(solidCss) : '';
	const regularCssSubset = config.names.regular.length ? subsetFontFaceCss(regularCss) : '';
	const brandsCssSubset = config.names.brands.length ? subsetFontFaceCss(brandsCss) : '';

	const css = [
		fontawesomeCssSubset,
		solidCssSubset,
		regularCssSubset,
		brandsCssSubset
	].join("\n");

	const cssEmbed = embedFont(css);

	const cleanCss = new CleanCSS();
	const cssMin = cleanCss.minify(css).styles;
	const cssEmbedMin = cleanCss.minify(cssEmbed).styles;

	writeCss(`${config.dist}/fontawesome-subset.css`, css);
	writeCss(`${config.dist}/fontawesome-subset-embed.css`, cssEmbed);
	writeCss(`${config.dist}/fontawesome-subset.min.css`, cssMin);
	writeCss(`${config.dist}/fontawesome-subset-embed.min.css`, cssEmbedMin);
};

module.exports = buildCss;