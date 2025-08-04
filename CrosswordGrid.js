class CrosswordGrid {
    constructor(width, height) {
        this.EMPTY = '_';
        this.BLOCKED = '#';

        this.width = width;
        this.height = height;
        this.grid = Array.from(
            {length: height},
            () => Array.from({length: width}, () => this.EMPTY)
        );

        this.placements = [];
        this.assignments = new Map();
        this.usedWords = new Set();
    }

    toString() {
        return this.grid.map(row =>
            row.map(c => c || '.').join(' ')
        ).join('\n');
    }

    debugPrint() {
        console.log(this.toString());
    }

    getCellLetter(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this.BLOCKED;
        return this.grid[y][x];
    }

    setCellLetter(x, y, c) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        this.grid[y][x] = c;
    }

    clearGrid() {
        this.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell !== this.BLOCKED) this.setCellLetter(x, y, this.EMPTY);
            });
        });
        this.assignments.clear();
        this.usedWords.clear();
        this.placements = [];
    }

    fill(wordPool) {
        const tryPlaceWord = (word, dir, cells) => {
            for (let k = 0; k < word.length; k++) {
                const [x, y] = cells[k];
                this.setCellLetter(x, y, word[k]);
                this.assignments.set(`${x},${y}`, word[k]);
            }
        };

        if (wordPool.length < 1) return [];
        this.clearGrid();
        const placements = [];

        let firstWord;
        [firstWord, wordPool] = this.chooseFirstWord(wordPool);
        this.placeFirstWord(firstWord, placements);

        wordPool.forEach(word => {
            const candidates = this.getValidPlacements(word, placements);
            if (candidates.length > 0) {
                const {dir, cells} = candidates[0];
                tryPlaceWord(word, dir, cells);
                this.assignments.set(`${dir}:${cells.map(([x, y]) => `${x},${y}`)
                    .join('|')}`, word);
                this.usedWords.add(word);
                placements.push({word, dir, cells});
            }
        });

        this.placements = placements;
        return placements;
    }

    chooseFirstWord(wordPool) {
        // wordPool = wordPool.sort((a, b) => b.length - a.length);
        const firstWord = [...wordPool].sort((a, b) => b.length - a.length).shift();
        wordPool = wordPool.filter(w => firstWord !== w)
        this.usedWords.add(firstWord);
        return [firstWord, wordPool];
    }

    placeFirstWord(firstWord, placements) {
        const dir = Math.random() > 0.5 ? 'H' : 'V';

        let x, y;
        if (dir === 'H') {
            y = Math.floor(this.height / 2);
            x = Math.floor((this.width - firstWord.length) / 2);
        } else {
            x = Math.floor(this.width / 2);
            y = Math.floor((this.height - firstWord.length) / 2);
        }

        const cells = [];
        [...firstWord].forEach((char, i) => {
            const cx = dir === 'H' ? x + i : x;
            const cy = dir === 'H' ? y : y + i;
            this.setCellLetter(cx, cy, char);
            cells.push([cx, cy]);
        });

        const firstPlacement = {word: firstWord, dir, cells};
        placements.push(firstPlacement);
        this.assignments.set(
            `${dir}:${cells.map(([x, y]) => `${x},${y}`).join('|')}`,
            firstWord
        );
        return firstPlacement;
    }

    getValidPlacements(word, placements) {
        const computeStart = (pivot, idx, dir) => {
            const [px, py] = pivot;
            return {
                x: dir === 'H' ? px - idx : px,
                y: dir === 'H' ? py : py - idx
            };
        };
        const withinBounds = (x, y, dir, len) =>
            x >= 0 && y >= 0 &&
            (dir === 'H' ? x + len <= this.width : y + len <= this.height);
        const getWordCells = (x, y, dir, len) => {
            const cells = [];
            for (let k = 0; k < len; k++) {
                cells.push([
                    dir === 'H' ? x + k : x,
                    dir === 'H' ? y : y + k
                ]);
            }
            return cells;
        };

        const isCompatible = (cells, w) => {
            for (let k = 0; k < w.length; k++) {
                const [x, y] = cells[k];
                const c = this.getCellLetter(x, y);
                if (c !== this.EMPTY && c !== w[k]) return false;
            }
            return true;
        };

        const hasNoSideContact = (cells, dir) => {
            const deltas = dir === 'H' ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
            for (const [x, y] of cells) {
                if (this.getCellLetter(x, y) !== this.EMPTY) continue;
                for (const [dx, dy] of deltas) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
                    const n = this.getCellLetter(nx, ny);
                    if (n !== this.EMPTY && n !== this.BLOCKED) return false;
                }
            }
            return true;
        };

        const hasBlockedEnds = (x, y, dir, len) => {
            const before = dir === 'H' ? this.getCellLetter(x - 1, y) : this.getCellLetter(x, y - 1);
            const after = dir === 'H' ? this.getCellLetter(x + len, y) : this.getCellLetter(x, y + len);
            const ok = c => c === this.EMPTY || c === this.BLOCKED;
            return ok(before) && ok(after);
        };

        const isNested = (cells, dir) => {
            return placements.some(pl => {
                if (pl.dir !== dir) return false;
                if (cells.every(c => pl.cells.some(pc => pc[0] === c[0] && pc[1] === c[1]))) return true;
                if (pl.cells.every(pc => cells.some(c => c[0] === pc[0] && c[1] === pc[1]))) return true;
                return false;
            });
        };

        const candidates = [];
        for (const placed of placements) {
            const perp = placed.dir === 'H' ? 'V' : 'H';
            for (let i = 0; i < placed.word.length; i++) {
                for (let j = 0; j < word.length; j++) {

                    if (placed.word[i] !== word[j]) continue;

                    const {x, y} = computeStart(placed.cells[i], j, perp);
                    if (!withinBounds(x, y, perp, word.length)) continue;

                    const cells = getWordCells(x, y, perp, word.length);
                    if (!isCompatible(cells, word)) continue;
                    if (!hasNoSideContact(cells, perp)) continue;
                    if (!hasBlockedEnds(x, y, perp, word.length)) continue;
                    if (isNested(cells, perp)) continue;

                    candidates.push({word, dir: perp, cells});
                }
            }
        }

        return candidates;
    }


    crop() {
        const isEmpty = c => c === this.EMPTY;

        const isRowEmpty = row => row.every(isEmpty);
        const isColEmpty = col =>
            this.grid.every(row => isEmpty(row[col]));

        let top = 0, bottom = this.grid.length - 1;
        while (top <= bottom && isRowEmpty(this.grid[top])) top++;
        while (bottom >= top && isRowEmpty(this.grid[bottom])) bottom--;

        let left = 0, right = this.grid[0].length - 1;
        while (left <= right && isColEmpty(left)) left++;
        while (right >= left && isColEmpty(right)) right--;

        top = Math.max(0, top);
        left = Math.max(0, left);
        bottom = Math.max(top, bottom);
        right = Math.max(left, right);

        this.grid = this.grid
            .slice(top, bottom + 1)
            .map(row => row.slice(left, right + 1));

        this.width = this.grid[0]?.length || 0;
        this.height = this.grid.length;

        this.placements.forEach(p => {
            p.cells = p.cells.map(([x, y]) => [x - left, y - top]);
        });

        return this.placements;
    }
}
