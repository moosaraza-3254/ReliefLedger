const router = require('./routes/admin');
console.log('router keys:', Object.keys(router));
console.log('stack length', router.stack.length);
router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(i, layer.route.methods, layer.route.path);
  } else {
    console.log(i, 'middleware', layer.name);
  }
});