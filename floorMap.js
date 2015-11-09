vehicleLocation = [0,42];
console.log('\n');
asciiLocationMap(vehicleLocation);
console.log('\n');

function asciiLocationMap(vehicleLocation) {
	hallwayLocation = [0, 18, 28, 46]
	floorMap = [];

	for (var i = 0; i < 47; i++){
		floorMap.push('|    |');
	}
	floorMap[hallwayLocation[0]] = '|----|';
	floorMap[hallwayLocation[1]] = '|----|';
	floorMap[hallwayLocation[2]] = '|----|';
	floorMap[hallwayLocation[3]] = '|----|';
	floorMap[48] = '012345'

	var count = -1;
	floorMap.map(function (item){
		count++ 
		for (var i = 0, len = item.length, str = '', row = 46; i < len; i++){
			str = str + item[i] + ' ';
		};
		mapDisplay(row, count, str);

	});

	function mapDisplay(row, count, str) {
		var num = row - count;
		var numStr;
		numStr = num.toString();
		if (num < 10) numStr = num.toString() + ' ';
		if (num < 0) numStr = '  ';
		var check = atRow(hallwayLocation, num);
		if (num === vehicleLocation[1] && check === true) {
			console.log(numStr + '    ' + str.substring(0, vehicleLocation[0] * 2) + 'X' + str.substring(vehicleLocation[0] * 2 + 1, str.length));
		} else {
			console.log(numStr + '    ' + str);
		};
	};

	function atRow(hallwayLocation, num) {
		for (var i = 0; i < hallwayLocation.length; i++){
			if (hallwayLocation[i] === num || vehicleLocation[0] === 0 || vehicleLocation[0] === 5) {
				return true;
				break;
			} 
		} return false;
	}
}
