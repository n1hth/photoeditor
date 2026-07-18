const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="box" style="position: absolute; left: 100px; top: 100px; width: 100px; height: 100px; transform: translate(-50%, -50%) rotate(90deg); transform-origin: center;"></div>
</body>
</html>
`);
const el = dom.window.document.getElementById('box');
// JSDOM doesn't do layout. So I can't read getBoundingClientRect.
