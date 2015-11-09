var ml = require('machine_learning');

var data = [[]];

var result = [];

var n = 3;

var knn =  new ml.KNN({
	data: data,
	result: result
});

var y = knn.predict({
	x: [],
	k: n,
	weightf: {type: 'gaussian', sigma: 10.0}
	distance: {type: 'euclidean'}
});

console.log(y);