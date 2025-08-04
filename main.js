const CELL_SIZE = 40;
const MARGIN = 50;
const BG_COLOR = 0xaaaaaa;
const NUM_GRIDS = 10;

const wordList = dictionary.split('\n');
const trie = buildTrie(wordList);
let drawn = [];

const config = {
    type: Phaser.AUTO,
    backgroundColor: BG_COLOR,
    height: 600,
    width: 600,
    scene: {create}
};
new Phaser.Game(config);

const allGridsMap = new Map();
let allGridsArr;
let gridIndex = 0;

function create() {
    const bag = window.prompt("Enter your letters (no space):", "SEAT");
    if (!bag) return;

    while (allGridsMap.size < NUM_GRIDS) {
        const grid = new CrosswordGrid(bag.length * 2, bag.length * 2);
        const words = trie.makeWords(bag, true);

        grid.fill(words);
        grid.crop();

        if (grid.placements.length === wordList.length && !allGridsMap.has(grid.toString())) {
            allGridsMap.set(grid.toString(), grid);
        }
    }

    allGridsArr = Array.from(allGridsMap.values());

    const nextButton = this.add.text(25, 20, 'Next', {
        font: '18px monospace',
        backgroundColor: '#000',
        color: '#fff',
        padding: {x: 10, y: 5}
    })
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => {
            gridIndex = (gridIndex + 1) % allGridsArr.length;
            drawGridByIndex(this, allGridsArr, gridIndex);
        });

    const prevButton = this.add.text(125, 20, 'Prev', {
        font: '18px monospace',
        backgroundColor: '#000',
        color: '#fff',
        padding: {x: 10, y: 5}
    })
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => {
            gridIndex = gridIndex <= 0 ? allGridsArr.length - 1 : gridIndex - 1;
            drawGridByIndex(this, allGridsArr, gridIndex);
        });

    drawGridByIndex(this, allGridsArr, gridIndex);
}

function buildTrie(words) {
    const t = new Trie();
    words.forEach(w => t.insert(w));
    return t;
}

function drawGridByIndex(scene, gridsArr, index) {
    const currentGrid = gridsArr[index];
    const currentPlacements = currentGrid.placements;

    drawn.forEach(e => e.destroy());
    drawn = [];
    scene.cameras.main.setScroll(0, 0);

    drawCells(scene, currentPlacements);
    drawLabels(scene, currentPlacements);

    const gridWidth = currentGrid.width * CELL_SIZE;
    const gridHeight = currentGrid.height * CELL_SIZE;
    const offsetX = (scene.scale.width - gridWidth) / 2;
    const offsetY = (scene.scale.height - gridHeight) / 2;

    scene.cameras.main.setScroll(-offsetX, -offsetY);
}

function drawCells(scene, placements) {
    placements.forEach(({word, cells}) => {
        cells.forEach(([x, y], i) => {
            const drawX = x * CELL_SIZE + MARGIN / 2;
            const drawY = y * CELL_SIZE + MARGIN / 2;

            drawn.push(
                scene.add.rectangle(drawX, drawY, CELL_SIZE, CELL_SIZE, 0xffffff)
                    .setOrigin(0)
                    .setStrokeStyle(2, 0x000000)
            );

            drawn.push(
                scene.add.text(
                    drawX + 15, drawY + 15,
                    word[i],
                    {font: '20px monospace', fill: 'black'}
                )
            );
        });
    });
}

function drawLabels(scene, placements) {
    const seen = new Set();
    let idx = 1;

    for (const {cells} of placements) {
        const [x, y] = cells[0];
        const key = `${x}|${y}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const drawX = x * CELL_SIZE + MARGIN / 2;
        const drawY = y * CELL_SIZE + MARGIN / 2;

        drawn.push(
            scene.add.text(
                drawX + 2, drawY + 2,
                `${idx++}`,
                {font: '12px monospace', fill: 'purple'}
            )
        );

    }
    
    drawn.push(
        scene.add.text(
            85, 60,
            `${gridIndex + 1}/${allGridsArr.length}`,
            {font: '20px monospace', fill: 'crimson'}
        ).setScrollFactor(0)
    );
}
