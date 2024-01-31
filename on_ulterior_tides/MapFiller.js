//количество ячеек сетки
//количество ячеек сетки
let mapSizeL = 37; //ширина
let mapSizeH = 47; //высота

let mapOffsetL = 24; // смещение сетки ширина в гексах
let mapOffsetH = 20; // смещение сетки высота в гексах

let gridSizeModifyerL = 0; ////смещение нулевой линии по ширине, px
let gridSizeModifyerH = 0.24; //смещение нулевой линии по высоте, px

let reverse = true // смена длинны на ширину при установке тайлов
let firstLine = true;

//особые гексы (можно записать как свойство определенного гекса)
let borderLimits = 3; //Количество тайлов от границы для спавна мест помеченных как "limited"
let closerLimits = 4; //Количество тайлов от ближайшего "limited" в радиусе
let aditionalTags = []// Дополнительные теги отбора устанавливаемых тайлов // должны быть присущи всем!

//заполняет все однотипно чтобы упростить отладку параметров
const debug = false
// isTile - пустые места игнорировать или ставить заполнитель
// defaulTileName - название тайла в таггере для 
let mapTiles = {
    "empty"             : {min: 0,  max: 65, default:true, isTile: true, defaulTileName: "waves_auto"},//65% 
    "isle"              : { min: 66, max: 69, },//3%
    "island"            : { min: 70, max: 71, },//1%
    "rust"              : { min: 72, max: 74 },//2%
    "reefs"             : { min: 75, max: 77 },//2%
    "otmel"             : { min: 78, max: 80 },//2%
    "spoiled"           : { min: 81, max: 83 },//2%
    "zongs"             : { min: 84, max: 85 },//1%
    "creeps"            : { min: 86, max: 87 },//1%
    "hill"              : {min: 88, max: 90, maxCount: 1 ,diceAroundHex:"1d6",limited: true, sateliteHex: "island"},//3%
    "stodimye"          : {min: 91, max: 94, maxCount: 1 ,diceAroundHex:"1d6",limited: true, sateliteHex: "island"},//3%
    "svetoch"           : {min: 95, max: 97, maxCount: 1 ,diceAroundHex:"1d6",limited: true, sateliteHex: "island"},//3%
    "bonefish"          : {min: 98, max: 100, maxCount: 1 ,diceAroundHex:"1d6",limited: true,borderLimit:4,closerLimit : 4, sateliteHex: "bone-lab"},//3%
}

const DiceRoll = `1d${Object.values(mapTiles).sort((a, b) => b.max - a.max)[0].max}`
const tilesName = Object.keys(mapTiles)
const tilesObject = Object.values(mapTiles)

//таблица всех кто имеет сателиты
const hashTableMainTilesIndexes = []; tilesObject.forEach((element,index) => {if (element?.sateliteHex) hashTableMainTilesIndexes.push(index)})

//стандартный тайл на который мы будем менять всех неугодных
const defaultIndex = tilesObject.findIndex(e => e?.default)






function fillInnHash(sizeL,sizeH) {
    return Array(sizeL).fill(Array(sizeH).fill(0).map((_,p)=> {return p}))
}



function removeFromHash(hash = [],posl,posh) {
    hash[posl][posh] = 1;
    return hash.map(line=> line.filter(elem => elem != 1))
}

function randIntExcep(exp = []) {
    if (!exp.length) return undefined;
    return exp[Math.floor(Math.random() * exp.length)];
}

function onRadius (posl,posh,posLM,posHM,rad) {
    return (posl - posHM)^2 + (posh - posLM)^2 <= rad^2
} 

function mapToLine (hash) {
    let flatmap = []
    let counter = 0;
    for (let posL = 0; posL < hash.length; posL++) {
        const line = hash[posL];
        for (let posH = 0; posH < line.length; posH++) {
            flatmap.push({
                counter,
                posL,
                posH,
                val: 0
            })
            counter += 1;
        }
    }
    return flatmap
}

function removeFromHashFlat(hash = [],counter) {
    hash[counter].val = 1;
    return hash.filter(elem=> elem.val != 1)
}

function removeFromHashByRadonFlat (hash,poslM,poshM,rad) {
    let newHash = [...hash]

    for (let posL = 0; posL < hash.length; posL++) {
        const item = hash[posL];
        if (onRadius(item.posL,item.posH,poslM,poshM,rad)) {
            newHash = removeFromHashFlat(hash,item.counter)
        }
        
    }
    return newHash
}

function removeBorder (hash =[],borderLimit) {
    const borderedStart = borderLimit
    const borderedH = mapSizeH-1-borderLimit;
    const borderedL = mapSizeL-1-borderLimit;

    const hashed = hash.map(el => {
       if((borderedH < el.posH) || (el.posH < borderedStart)) {el.val = 1}
       if((borderedL < el.posL) || (el.posH < borderedStart)) {el.val = 1}
    })
    return hashed.filter(elem=> elem.val != 1)
}


function removeFromHashByRad (hash,poslM,poshM,rad) {
    let newHash = [...hash]

    for (let posL = 0; posL < hash.length; posL++) {
        const line = hash[posL];
        for (let posH = 0; posH < line.length; posH++) {
            if (onRadius(posL,posH,poslM,poshM,rad)) {
                newHash = removeFromHash(hash,posL,posH)
            }
        }
    }
    return newHash
}

function TileIsPlaced (posX,posY,listOftiles,gridSize) {
    for (let tile of listOftiles) {
        
        let x = tile.x; // x-coordinate of the tile
        let y = tile.y; // y-coordinate of the tile
        let XtilePlaced = x < posX + gridSize/2 && x > posX - gridSize/2
        let YtilePlaced = y < posY + gridSize/2 && y > posY - gridSize/2
        if (YtilePlaced && XtilePlaced) {return true}

    }   
    return false
}


void async function main () {
    ui.notifications.info("Заполнение карты в активной сцене начато. Ожидайте дальнейших уведомлений.");


    
    //заполняем матрицу наших тайлов
    let hashTableCount = { };
    let hashTableOfmainPlaced = [];
    let cells = (Array(mapSizeL).fill(Array(mapSizeH).fill(0))).map((arr,PosL) => {
        return arr.map((e,PosH) => {
            let rollValue = new Roll(DiceRoll).evaluate({async: false}).total
            let indexTile = tilesObject.findIndex((element) => {return (rollValue >= element.min && rollValue <= element.max) || defaultIndex})
            //игнорирую уже поставленные тайлы которых неможет быть чем заданное количество
            if (hashTableCount[indexTile]) {
                if (hashTableCount[indexTile] >= tilesObject[indexTile].maxCount) {
                    return defaultIndex
                }
                hashTableCount[indexTile] += 1 
            }else{
                hashTableCount[indexTile] = 1
            }
            //если у гекса может быть сателитный гекс
            if (tilesObject[indexTile]?.sateliteHex) {
                //сгенерю их позицию позже 
                //ролим
                let rollAround = new Roll(tilesObject[indexTile]?.diceAroundHex || "0").evaluate({async: false}).total
                //сохраняем для дальнейшего измененния карты
                hashTableOfmainPlaced.push({rollAround,indexTile})
                indexTile = defaultIndex;
            }
            return indexTile
        })
    });


        

    let heightHashL = [];
    let heightHashH = [];


    //перебираю гексы и заменяю некоторые на сателиты
    let HashMainPlace = mapToLine(fillInnHash(mapSizeL,mapSizeH))
    


    hashTableOfmainPlaced.forEach(item => {
        const tileId = item.indexTile;
        const tile = mapTiles[tileId];
        //удаляем из псевдо хэш таблицы все ячейки которые находятся на границе
        const borderLimit = (tile?.borderLimit)? tile.borderLimit : borderLimits;
        const curWorkHash = (tile?.limited)?  removeBorder(HashMainPlace,borderLimit) : HashMainPlace

        const closerLimit = (tile?.closerLimit)? tile.closerLimit : closerLimits;
        //получаем случайное положение по хэш таблице
        const elem = randIntExcep(curWorkHash)
        if (!elem) return;// больше места не нашлось
        const PosL = elem.posL
        const PosH = elem.posH
        //удаляем из хэш таблицы значения которые находятся в радиусе запрета
        HashMainPlace = removeFromHashByRadonFlat(HashMainPlace,elem.PosL,elem.PosH,closerLimit)

        //добавляем тайл в общую карту
        cells[PosL][PosH] = item.indexTile



        //проверю ближайшие чтобы не удалить один из "особых тайлов" случайно
        // в тупую не бейте ногами ок?
        let rollAround = item.rollAround
        let basicIndex = item.indexTile
        let sateliteHex = tilesObject[basicIndex].sateliteHex;
        for (let l = -1; l < 1; l++) {
            for (let h = -1; h < 1; h++) {
                //защищаемся от выхода за нижнюю границу
                if (PosL+l < 0 || PosH+h < 0 ) continue;
                if (PosL+l > cells.length-1 || PosH+h > cells.length-1) continue;
                let index = cells[PosL+l][PosH+h]
                //сам себя то зачем
                if (l == 0 && h == 0) continue;
                //проверяю на "особеность"
                if (hashTableMainTilesIndexes.includes(index)) continue;
                //если не осталось тайлов для размещения
                if(rollAround <= 0) break;
                cells[PosL-l][PosH-h] = sateliteHex;
                rollAround -= 1
            }
        }
    })



    cells = cells.map((arr) =>arr.map((e) => { 
        return (debug)? tilesName[2] : (Number.isInteger(e))? tilesName[e] : e;
    }))

    console.log(cells);
    // Получение данных сцены напрямую, без использования .data
    let currentScene = game.scenes.active;
    let sceneGrid = currentScene.grid
    let gridSize = sceneGrid.size;
    // Размеры сцены
    let sceneWidth = currentScene.width;
    let sceneHeight = currentScene.height;
    // Расчет количества гексов

    let hexesAcross = Math.ceil(sceneWidth / gridSize);
    let hexesDown = Math.ceil(sceneHeight / (gridSize * 0.75)); // 0.75 - корректировка для вертикального расстояния между гексами


    let mapOffsetPixelsL = gridSize * mapOffsetL; // смещение сетки ширина в гексах
    let mapOffsetPixelsHEven = gridSize*0.5 + mapOffsetH*gridSize; // смещение сетки ширина в гексах
    let mapOffsetPixelsHNon = mapOffsetH * gridSize; // смещение сетки высота в гексах


    function even_or_odd(number) {
        return number % 2 === 0 ? true : false;
    }

    gridSizeL = gridSize + gridSizeModifyerL
    gridSizeH = gridSize + gridSizeModifyerH


    let sceneTiles = currentScene.tiles;

    let newTiles = []

    for (let posL = 0; posL < cells.length; posL++) {
        mapOffsetPixelsH =  (even_or_odd(posL))? mapOffsetPixelsHEven :  mapOffsetPixelsHNon
        for (let posH = 0; posH < cells[posL].length; posH++) {
            
            let localTileName = cells[posL][posH]
            if (localTileName == tilesName[defaultIndex]) {
                if (mapTiles[tilesName[defaultIndex]]?.isTile != true) {
                    continue;
                }else{
                    localTileName = mapTiles[tilesName[defaultIndex]].defaulTileName
                }
            }

            let originalTile = Tagger.getByTag([localTileName,...aditionalTags])[0] 
            let newTile = originalTile.clone().toJSON();

            let X = (even_or_odd(posH))?    gridSizeL * mapOffsetL + gridSizeL*posL           : gridSizeL * mapOffsetL + gridSizeL*0.5 + gridSizeL*posL;
            let Y = (even_or_odd(posH))?    gridSizeH * mapOffsetH*Math.sqrt(3)/2  + gridSizeH*posH*Math.sqrt(3)/2 : gridSizeH * mapOffsetH*Math.sqrt(3)/2 + (gridSizeH*Math.sqrt(3)/2)*posH;
            newTile.x = (reverse)? X : Y;
            newTile.y = (reverse)? Y : X;
            if (TileIsPlaced(newTile.x,newTile.y,sceneTiles,gridSize)) {
                resolve(true)
            }else{
                newTile.flags.tagger.tags.push(...["mapTile", "canBeDeleted"])
                newTiles.push(newTile)
            }
        }
    }
    
    await currentScene.createEmbeddedDocuments("Tile", newTiles)

    ui.notifications.info("Заполнение карты завершено")





} ()

