let mut x = 1;
let y = match x {
    1 => 2 >> (3 + 4),
    2 => 2 | (2 & 4)
};

let z = math.random(x, y);