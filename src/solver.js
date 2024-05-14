/*function Solver(maze) {
	this.maze = maze;
	this.maxSolve = maze.maxSolve;
	this.start = false;
	this.finish = false;
	this.solved = false;
	this.path = false;
}

Solver.prototype.solve = function() {
	const startPosition = getEntryNode(this.maze.entryNodes, 'start');
	const endPosition = getEntryNode(this.maze.entryNodes, 'end');

	// Get nodes (from the maze matrix) that have connections to other nodes.
	const nodes = this.getMazeSolveNodes(startPosition, endPosition);

	// Get the connections for every solve node.
	const connected = this.connectMazeSolveNodes(nodes);

	if (this.maze.wallsRemoved) {
		this.path = this.walkMazeAstar(connected);
	} else {
		this.path = this.walkMaze(connected);
	}
}

Solver.prototype.getMazeSolveNodes = function(start, end) {
	const matrix = this.maze.matrix;
	const nodes = [];

	// Property used (by both solvers) to find and draw the path to the exit
	const previous = undefined;

	const rowCount = matrix.length;
	for (let y = 0; y < rowCount; y++) {

		if (y === 0 || y === (rowCount - 1) || (0 === (y % 2))) {
			// First and last rows are walls only.
			// Even rows don't have any connections
			continue;
		}

		let rowLength = matrix[y].length;
		for (let x = 0; x < rowLength; x++) {
			if (stringVal(matrix[y], x)) {
				// Walls don't have connections.
				continue;
			}

			const nswe = {
				'n': (0 < y) && stringVal(matrix[y - 1], x),
				's': (rowCount > y) && stringVal(matrix[y + 1], x),
				'w': (0 < x) && stringVal(matrix[y], (x - 1)),
				'e': (rowLength > x) && stringVal(matrix[y], (x + 1))
			}

			if (start && end) {
				if ((x === start.x) && (y === start.y)) {
					this.start = nodes.length;
					nodes.push({ x, y, nswe, previous });
					continue;
				}

				if ((x === end.x) && (y === end.y)) {
					this.finish = nodes.length;
					nodes.push({ x, y, nswe, previous });
					continue;
				}
			}

			// Walls left or right
			if (nswe['w'] || nswe['e']) {
				// left or right direction possible
				if (!nswe['w'] || !nswe['e']) {
					nodes.push({ x, y, nswe, previous });
					continue;

				} else {
					// Up or down direction possible.
					if ((!nswe['n'] && nswe['s']) || (nswe['n'] && !nswe['s'])) {
						nodes.push({ x, y, nswe, previous });
						continue;
					}
				}
			} else {
				// All directions possible
				if (!nswe['n'] && !nswe['s'] && !nswe['w'] && !nswe['e']) {
					nodes.push({ x, y, nswe, previous });
					continue;
				} else {
					// Up or down direction possible.
					if ((!nswe['n'] && nswe['s']) || (nswe['n'] && !nswe['s'])) {
						nodes.push({ x, y, nswe, previous });
						continue;
					}
				}
			}
		} // x loop
	} // y loop

	return nodes;
}

Solver.prototype.connectMazeSolveNodes = function(nodes) {
	// Connect nodes to their neighbours.
	const y_nodes = {};
	const nodes_length = nodes.length;

	for (let i = 0; i < nodes_length; i++) {
		nodes[i]['connected'] = {};
		let x = nodes[i]['x'];
		let y = nodes[i]['y'];

		if (!nodes[i]['nswe']['w']) {
			nodes[i]['connected']['w'] = i - 1;
		}

		if (!nodes[i]['nswe']['e']) {
			nodes[i]['connected']['e'] = i + 1;
		}

		if (!nodes[i]['nswe']['n'] && y_nodes.hasOwnProperty(x)) {
			nodes[i]['connected']['n'] = y_nodes[x];

			if (nodes.hasOwnProperty(y_nodes[x])) {
				nodes[y_nodes[x]]['connected']['s'] = i;
				delete y_nodes[x];
			}
		}

		if (!nodes[i]['nswe']['s']) {
			y_nodes[x] = i;
		}

		if (this.maze.wallsRemoved) {
			// Not needed for A star solve
			delete nodes[i]['nswe'];
		}
	}

	return nodes;
}

Solver.prototype.heuristic = function(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

Solver.prototype.walkMazeAstar = function(nodes) {
	this.solved = false;

	if (!nodes.length) {
		return;
	}

	let openSet = [];
	let closedSet = [];

	let startNode = 0;
	let endNode = nodes.length - 1;
	if ((false !== this.start) && (false !== this.finish)) {
		startNode = this.start;
		endNode = this.finish;
	}

	// Add defaults to all nodes before we walk the maze.
	nodes.forEach( e => {
		e['f'] = 0;
		e['g'] = 0;
		e['h'] = 0;
	});

	openSet.push(startNode);

	let max = 0;

	while (openSet.length > 0) {
		max++
		if (this.maxSolve && (this.maxSolve < max)) {
			alert('Solving maze took too long. Please try again or use smaller maze dimensions');
			break
		}

		// Best next option
		let winner = 0;
		for (let i = 0; i < openSet.length; i++) {
			if (nodes[openSet[i]].f < nodes[openSet[winner]].f) {
				winner = i;
			}
		}

		var current = nodes[openSet[winner]];
		let currentKey = openSet[winner]

		// Did I finish?
		if (current === nodes[endNode]) {
			this.solved = true;
			break;
		}

		removeFromArray(openSet, openSet[winner]);
		closedSet.push(currentKey);

		let neighbors = [];
		for (key in current.connected) {
			if (current.connected.hasOwnProperty(key)) {
				neighbors.push(current.connected[key]);
			}
		}

		for (let i = 0; i < neighbors.length; i++) {
			let neighbor = nodes[neighbors[i]];

			// Valid next spot?
			if (!closedSet.includes(neighbors[i])) {
				let tempG = current.g + this.heuristic(neighbor, current);

				// Is this a better path than before?
				let newPath = false;
				if (openSet.includes(neighbors[i])) {
					if (tempG < neighbor.g) {
						neighbor.g = tempG;
						newPath = true;
					}
				} else {
					neighbor.g = tempG;
					newPath = true;
					openSet.push(neighbors[i]);
				}

				// Yes, it's a better path
				if (newPath) {
					neighbor.h = this.heuristic(neighbor, nodes[endNode]);
					neighbor.f = neighbor.g + neighbor.h;
					neighbor.previous = currentKey;
				}
			}
		}
	}

	path = [];
	let temp = current;
	path.push(temp);
	while (temp.previous) {
		path.push(nodes[temp.previous]);
		temp = nodes[temp.previous];
	}

	// Add the startNode for drawing the solved path.
	path.push(nodes[startNode]);

	return path;
}

Solver.prototype.walkMaze = function(nodes) {
	this.solved = false;

	if (!nodes.length) {
		return;
	}

	let startNode = 0;
	let endNode = nodes.length - 1;
	if ((false !== this.start) && (false !== this.finish)) {
		startNode = this.start;
		endNode = this.finish;
	}

	let max = 0;
	let i = 0;
	let node = false;
	let from = false;
	const multi_nodes = [];
	const opposite = { 'n': 's', 's': 'n', 'w': 'e', 'e': 'w' };

	while (this.solved === false) {
		max++
		if (this.maxSolve && (this.maxSolve < max)) {
			alert('Solving maze took too long. Please try again or use smaller maze dimensions');
			break
		}

		if (!node) {
			i = startNode;
			node = nodes[i];
		}

		if (i === endNode) {
			// Found the end node.
			this.solved = true;
			break
		}

		node['count'] = 4 - (Object.keys(node['nswe'])
				.map(key => !node['nswe'][key] ? 0 : 1)
				.reduce((a, b) => a + b, 0));

		if (node.count > 2) {
			if (-1 === multi_nodes.indexOf(i)) {
				multi_nodes.push(i);
			}
		}

		if (false !== from) {
			node['nswe'][from] = 1;
			node.count--;
			nodes[i] = node;
		}

		if (0 === node.count) {
			from = false;

			if (!multi_nodes.length) {
				// Jump back to start.
				i = startNode;
				node = nodes[startNode];
				continue;
			}

			// Jump back to multiple directions node
			i = multi_nodes.pop();
			node = nodes[i];

			if (node.count > 1) {
				// Add multi node back if more than one option left
				multi_nodes.push(i);
			}
			continue;
		}

		let directions = Object.keys(node['nswe']).filter(key => !node['nswe'][key] ? true : false);
		let direction = directions[Math.floor(Math.random() * directions.length)];

		if (node.count >= 1) {
			node.count--;
			from = opposite[direction];
			node['nswe'][direction] = 1;
			node['previous'] = direction;
			nodes[i] = node;
		}

		if (node['connected'].hasOwnProperty(direction)) {
			i = node['connected'][direction];
			node = nodes[i];
		} else {
			// Error: Node is not connected to direction
			break;
		}
	}

	return nodes;
}

Solver.prototype.drawAstarSolve = function() {
	const nodes = this.path;
	const wallSize = this.maze.wallSize;

	const canvas = document.getElementById('maze');
	if (!canvas || !nodes.length || !this.solved) {
		return;
	}

	const canvas_width = ((this.maze.width * 2) + 1) * wallSize;
	const canvas_height = ((this.maze.height * 2) + 1) * wallSize;

	if (!((canvas.width === canvas_width) && (canvas.height === canvas_height))) {
		// Error: Not the expected canvas size.
		return;
	}

	const ctx = canvas.getContext('2d');
	ctx.fillStyle = this.maze.solveColor;

	let startNode = 0;
	let endNode = nodes.length - 1;
	let finished = false
	let node = false;

	const hasGates = (false !== this.start) && (false !== this.finish);
	if (hasGates) {
		startNode = this.start;
		endNode = this.finish;
		const gateEntry = getEntryNode(this.maze.entryNodes, 'start', true);

		ctx.fillRect((gateEntry.x * wallSize), (gateEntry.y * wallSize), wallSize, wallSize);
	}

	for (let i = nodes.length - 1; i >= 0; i--) {
		if (!(0 <= (i - 1))) {
			continue;
		}

		let previousX = nodes[i - 1].x;
		let previousY = nodes[i - 1].y;

		let start;
		let to_x;
		if (nodes[i].y === previousY) {
			let start = nodes[i].x
			let to_x = ((previousX - start) * wallSize) + wallSize;

			if (nodes[i].x > previousX) {
				start = previousX
				to_x = ((nodes[i].x - previousX) * wallSize) + wallSize;
			}

			ctx.fillRect((start * wallSize), (nodes[i].y * wallSize), to_x, wallSize);
		}

		if (nodes[i].x === previousX) {
			let start = nodes[i].y;
			let to_y = ((previousY - start) * wallSize) + wallSize;

			if (nodes[i].y > previousY) {
				start = previousY;
				to_y = ((nodes[i].y - previousY) * wallSize) + wallSize;
			}

			ctx.fillRect((nodes[i].x * wallSize), (start * wallSize), wallSize, to_y);
		}
	}

	if (hasGates) {
		const gateExit = getEntryNode(this.maze.entryNodes, 'end', true);
		ctx.fillRect((gateExit.x * wallSize), (gateExit.y * wallSize), wallSize, wallSize);
	}
}

Solver.prototype.draw = function() {
	const nodes = this.path;
	const wallSize = this.maze.wallSize;

	const canvas = document.getElementById('maze');
	if (!canvas || !nodes.length || !this.solved) {
		return;
	}

	const canvas_width = ((this.maze.width * 2) + 1) * wallSize;
	const canvas_height = ((this.maze.height * 2) + 1) * wallSize;

	if (!((canvas.width === canvas_width) && (canvas.height === canvas_height))) {
		// Error: Not the expected canvas size.
		return;
	}

	const ctx = canvas.getContext('2d');
	ctx.fillStyle = this.maze.solveColor;

	let max = 0;
	let i;
	let startNode = 0;
	let endNode = nodes.length - 1;
	let finished = false
	let node = false;

	const hasGates = (false !== this.start) && (false !== this.finish);
	if (hasGates) {
		startNode = this.start;
		endNode = this.finish;
		const gateEntry = getEntryNode(this.maze.entryNodes, 'start', true);

		ctx.fillRect((gateEntry.x * wallSize), (gateEntry.y * wallSize), wallSize, wallSize);
	}

	while (finished === false) {
		max++
		if (this.maxSolve && (this.maxSolve < max)) {
			alert('Solving maze took too long. Please try again or use smaller maze dimensions');
			break
		}

		if (!node) {
			node = nodes[startNode];
		}

		if (i === endNode) {
			finished = true;
			break
		}

		if (node.previous === "undefined" || node.connected === "undefined") {
			// Error: Last step or connected nodes doesn't exist.
			break;
		}

		if (!node.connected.hasOwnProperty(node.previous)) {
			// Error: Connected direction doesnt exist.
			break;
		}

		i = node.connected[node.previous];
		let connected_node = nodes[i];

		if (-1 !== ['w', 'e'].indexOf(node.previous)) {
			let start = node.x
			let to_x = ((connected_node.x - start) * wallSize) + wallSize;

			if ('w' === node.previous) {
				start = connected_node.x
				to_x = ((node.x - connected_node.x) * wallSize) + wallSize;
			}

			ctx.fillRect((start * wallSize), (node.y * wallSize), to_x, wallSize);
		}

		if (-1 !== ['n', 's'].indexOf(node.previous)) {
			let start = node.y;
			let to_y = ((connected_node.y - start) * wallSize) + wallSize;

			if ('n' === node.previous) {
				start = connected_node.y
				to_y = ((node.y - connected_node.y) * wallSize) + wallSize;
			}

			ctx.fillRect((node.x * wallSize), (start * wallSize), wallSize, to_y);
		}

		node = nodes[i];
	}

	if (hasGates) {
		const gateExit = getEntryNode(this.maze.entryNodes, 'end', true);
		ctx.fillRect((gateExit.x * wallSize), (gateExit.y * wallSize), wallSize, wallSize);
	}
} */

function MazeSolver(maze) {
    this.maze = maze;
    this.start = false;
    this.finish = false;
    this.path = false;
    this.currentPosition = false;
    this.timeout = false; // Flag to track timeout
    this.startTime = false; // Track start time
}

MazeSolver.prototype.draw = function() {
    const canvas = document.getElementById('maze');
    const ctx = canvas.getContext('2d');
    const wallSize = this.maze.wallSize;

    // Draw the maze walls
    // Code to draw walls here...

    // Draw start and finish points
    // Code to draw start and finish points here...

    // Add event listener to handle user input
    canvas.addEventListener('keydown', (event) => this.handleUserInput(event));

    // Add event listener to solve maze button
    const solveButton = document.getElementById('solveButton');
    solveButton.addEventListener('click', () => this.solve());

    // Start timer
    this.startTime = Date.now();
    this.startTimer();
}

MazeSolver.prototype.startTimer = function() {
    // Start the timer to track the solving time
    const timerElement = document.getElementById('timer');
    setInterval(() => {
        const currentTime = Math.floor((Date.now() - this.startTime) / 1000); // Calculate elapsed time in seconds
        timerElement.textContent = `Time: ${currentTime} s`;
    }, 1000); // Update every second
}

MazeSolver.prototype.solve = function() {
    // Solving functionality
    // Code to solve the maze here...
}

MazeSolver.prototype.handleUserInput = function(event) {
    // Handle arrow key presses to move through the maze
    const key = event.key;
    let newDirection;

    switch (key) {
        case "ArrowUp":
            newDirection = "n";
            break;
        case "ArrowDown":
            newDirection = "s";
            break;
        case "ArrowLeft":
            newDirection = "w";
            break;
        case "ArrowRight":
            newDirection = "e";
            break;
        default:
            return; // Exit function for other keys
    }

    const newPosition = this.getNewPosition(newDirection);

    if (newPosition) {
        // Check if the new position is valid
        if (!this.isWall(newPosition)) {
            // Update current position and redraw the maze
            this.currentPosition = newPosition;
            this.redraw();

            // Check if user reached the finish point
            if (this.isFinish(newPosition)) {
                alert("Congratulations! You solved the maze.");
                this.showResult();
            }
        }
    }
}

MazeSolver.prototype.getNewPosition = function(direction) {
    // Get the new position based on user input direction
    const currentPosition = this.currentPosition;
    let newX, newY;

    switch (direction) {
        case "n":
            newX = currentPosition.x;
            newY = currentPosition.y - 1;
            break;
        case "s":
            newX = currentPosition.x;
            newY = currentPosition.y + 1;
            break;
        case "w":
            newX = currentPosition.x - 1;
            newY = currentPosition.y;
            break;
        case "e":
            newX = currentPosition.x + 1;
            newY = currentPosition.y;
            break;
        default:
            return false;
    }

    return { x: newX, y: newY };
}

MazeSolver.prototype.isWall = function(position) {
    // Check if the given position is a wall
    // Code to check if position is a wall here...
}

MazeSolver.prototype.redraw = function() {
    // Redraw the maze with the updated position
    // Code to redraw the maze here...
}

MazeSolver.prototype.showResult = function() {
    // Display the result of the maze solving (e.g., draw the solved path)
    // Code to display result here...
}

// Rest of the methods remain the same...

// Initialize the maze solver
const mazeSolver = new MazeSolver(yourMaze);
mazeSolver.draw();
