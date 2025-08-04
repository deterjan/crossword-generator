class Node {
    constructor({letter = '', children = new Map(), endOfWord = false} = {}) {
        this.letter = letter;
        this.children = children;
        this.endOfWord = endOfWord;
    }

    hasChild(letter) {
        return this.children.has(letter);
    }

    setChild(letter, node) {
        this.children.set(letter, node);
    }

    getChild(letter) {
        return this.children.get(letter);
    }
}

class Trie {
    constructor() {
        this.root = new Node({letter: "$"});
    }

    insert(word) {
        [...word.toUpperCase()].reduce((curNode, c) => {
            if (!curNode.hasChild(c)) curNode.setChild(c, new Node({letter: c, endOfWord: false}));
            return curNode.getChild(c);
        }, this.root).endOfWord = true;
    }

    has(word) {
        return [...word.toUpperCase()].reduce((acc, c) => {
            const childExists = acc?.curNode?.hasChild(c);
            const child = childExists ? acc.curNode.getChild(c) : null;
            const nextLen = acc.len - 1
            const atLastChar = nextLen === 0;

            if (acc.result) return {result: true, len: nextLen};
            if (childExists && atLastChar) if (child.endOfWord) return {result: true, len: nextLen};
            if (childExists) return {curNode: child, result: false, len: nextLen};
            return {result: false, len: nextLen};
        }, {curNode: this.root, result: false, len: word.length}).result;
    }

    makeWords(lettersMap, shuffle) {
        const countLetters = letters =>
            [...letters.toUpperCase()].reduce((map, c) => {
                map.set(c, (map.get(c) ?? 0) + 1);
                return map;
            }, new Map());

        const results = [];
        const supply = countLetters(lettersMap);

        const dfs = (node, path) => {
            if (path.length && node.endOfWord) results.push(path.join(''));

            for (const [letter, child] of node.children) {
                if ((supply.get(letter) ?? 0) > 0) {
                    supply.set(letter, supply.get(letter) - 1);
                    dfs(child, [...path, letter]);
                    supply.set(letter, supply.get(letter) + 1);
                }
            }
        };

        dfs(this.root, []);
        if (shuffle) this.shuffle(results);
        return results;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

function testTrie() {
    const assertEqual = (actual, expected, phrase) => {
        if (actual !== expected) {
            throw new Error(`❌ "${phrase}" — expected ${expected}, got ${actual}`);
        }
    }

    const necronomicon = new Trie();
    const phrase = [
        "that", "is", "not", "dead",
        "which", "can", "eternal", "lie",
        "and", "with", "strange", "aeons",
        "even", "death", "may", "die"
    ];
    phrase.forEach(w => necronomicon.insert(w))
    phrase.forEach(w => assertEqual(necronomicon.has(w), true, `${w} is not dead`));

    assertEqual(necronomicon.has("thatt"), false, "thatt is a corrupted");
    assertEqual(necronomicon.has("ded"), false, "ded is not dead");
    assertEqual(necronomicon.has("strangelove"), false, "strangelove is heresy");
    assertEqual(necronomicon.has("aeon"), false, "aeon is incomplete");
    assertEqual(necronomicon.has("maydie"), false, "maydie is a lie");
    assertEqual(necronomicon.has("eternallie"), false, "eternallie was not spoken");
    assertEqual(necronomicon.has("dea"), false, "dea dreams of death");
    assertEqual(necronomicon.has("stran"), false, "stran is stranded");
    assertEqual(necronomicon.has("withs"), false, "withs is mimicry");
    console.log("ALL TESTS PASSED");
}