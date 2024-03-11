//количество ячеек сетки
//количество ячеек сетки
let mapSizeL = 37; //ширина
let mapSizeH = 47; //высота

let mapOffsetL = 24; // смещение сетки ширина в гексах
let mapOffsetH = 20.04; // смещение сетки высота в гексах

let gridSizeModifyerL = 0; ////смещение нулевой линии по ширине, px
let gridSizeModifyerH = 0; //смещение нулевой линии по высоте, px

let reverse = true // смена длинны на ширину при установке тайлов

//особые гексы (можно записать как свойство определенного гекса)
let borderLimits = 3; //Количество тайлов от границы для спавна мест помеченных как "limited"
let closerLimits = 4; //Количество тайлов от ближайшего "limited" в радиусе
let aditionalTags = []// Дополнительные теги отбора устанавливаемых тайлов // должны быть присущи всем!

//Оставлет одну ячейку пустой в подходе к особым островам
let saveTresspass = false
//заполняет все однотипно чтобы упростить отладку параметров
const debug = false
const debugSpecificTiles = false // отключает спавн всех обычных тайлов
// isTile - пустые места игнорировать или ставить заполнитель
// defaulTileName - название тайла в таггере для 

let mapTiles = {
    "empty"     : {min: 0, max: 63, default:true, isTile: true, defaulTileName: "wowaves_auto"},//65%
    "isle"      : { min: 64, max: 67, },//3%
    "island"    : { min: 68, max: 69, },//1%
    "spoiled"   : { min: 70, max: 72 },//2%
    "reefs"     : { min: 73, max: 75 },//2%
    "flats"     : { min: 76, max: 78 },//2%
    "rust"      : { min: 79, max: 81 },//2%
    "zongs"     : { min: 82, max: 83 },//1%
    "creeps"    : { min: 84, max: 85 },//1%

    "salaith"   : {min: 86, max: 88, maxCount: 1 ,diceAroundHex:"1d4",limited: true,borderLimit:4,closerLimit : 4, sateliteHex: "island"},//3%
    "holm"      : {min: 89, max: 91, maxCount: 1 ,diceAroundHex:"1d4",limited: true, sateliteHex: "island"},//3%
    "ntepoah"   : {min: 92, max: 94, maxCount: 1 ,diceAroundHex:"1d4",limited: true, sateliteHex: "island",anothersatelites:[{dice:"1d2",hex:"reefs"}]},//3%
    "gnawer"    : {min: 95, max: 97, maxCount: 1 ,diceAroundHex:"7",limited: true, sateliteHex: "maze"},//3%
    "surgat"    : {min: 98, max: 100, maxCount: 1 ,diceAroundHex:"0",limited: true, sateliteHex: "island"},//3%

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

function removeha(hash = [],posl,posh) {
    let newHash = [...hash]
    let a = newHash.findIndex(e => e.l == posl && e.h == posh)
    newHash[a].val = 0
    return hash.filter(elem => elem?.val != 0)
}


function randIntExcep(exp = []) {
    if (!exp.length) return undefined;
    return exp[Math.floor(Math.random() * exp.length)];
}


function getHexagonsInRadius(centerX, centerY, radius) {
    let hexagons = [];
  
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        if (Math.abs(x) + Math.abs(y) <= radius) {
          hexagons.push({ l: centerX + x, h: centerY + y });
        }
      }
    }
    return hexagons;
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
    return hash.filter(elem=> elem?.val != 1)
}

function removeFromHashByRadonFlat (hash,poslM,poshM,rad) {
    let newHash = [...hash]
    let hexes = getHexagonsInRadius(poslM,poshM,rad)
    return newHash.filter(elem=> {
        let res = true;
        hexes.forEach((hex,ind)=> {
            if (hex.l == elem.posL && hex.h == elem.posH) {
                hexes.splice(ind, 1);
                res = false
            }
        })
        return res})
}

function removeBorder (hash =[],borderLimit) {
    const borderedStart = borderLimit
    const borderedH = mapSizeH-1-borderLimit;
    const borderedL = mapSizeL-1-borderLimit;

    const hashed = hash.map(el => {
       if((borderedH < el.posH) || (el.posH < borderedStart)) {el.val = 1}
       if((borderedL < el.posL) || (el.posH < borderedStart)) {el.val = 1}
       return el
    })
    return hashed.filter(elem=> elem?.val != 1)
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
    try {
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
                if (debugSpecificTiles) {
                    indexTile = defaultIndex;
                }
                return indexTile
            })
        });


        //собираю линейный вариант карты в виде хэш таблицы
        let HashMainPlace = mapToLine(fillInnHash(mapSizeL,mapSizeH))
        //перебираю гексы и заменяю некоторые на сателиты
        hashTableOfmainPlaced.forEach(item => {
            const tileId = item.indexTile;
            const tile = tilesObject[tileId];
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
            HashMainPlace = removeFromHashByRadonFlat(HashMainPlace,elem.posL,elem.posH,closerLimit)
            //добавляем тайл в общую карту
            cells[PosL][PosH] = item.indexTile



            //проверю ближайшие чтобы не удалить один из "особых тайлов" случайно
            let allplacetiles = []
            if (tile?.anothersatelites) {
                tile.anothersatelites.forEach(el => {
                    allplacetiles.push({dice: new Roll(el.dice || "0").evaluate({async: false}).total, hex: el.hex})
                })
            }
            // в тупую не бейте ногами ок?
            let rollAround = item.rollAround
            let basicIndex = item.indexTile
            let sateliteHex = tilesObject[basicIndex].sateliteHex;

            
            allplacetiles.push({dice: rollAround, hex: sateliteHex})
            let counttiles = 0;
            allplacetiles.forEach(el => counttiles += el.dice)
            //получим ид ближайших гексов для сателитов
            let satelitepos = getHexagonsInRadius(PosL,PosH,1)
           
            if (saveTresspass) {
                //уберем один тайл для прохода
                satelitepos[Math.floor(Math.random() * satelitepos.length)].val = 1
                satelitepos = satelitepos.filter(elem=> elem?.val != 1)
            }
            
            if (counttiles > 6) {
                let more = []
                more = getHexagonsInRadius(PosL,PosH,2)
                more = more.map((el))
                
                more.filter(elem=> {
                    let res = true;
                    satelitepos.map((hex,ind)=> {
                        if (hex.l == elem.posL && hex.h == elem.posH) {
                            res = false
                        }
                    })
                    return res
                })

                satelitepos = satelitepos.concat(more)
            }
            
            
            allplacetiles.forEach((el,pos) => {
                for (let c = 0; c < el.dice; c++) {
                    if (satelitepos == 0) return;
                    let he = randIntExcep(satelitepos)
                    if (he.l == PosL && PosH == he.h) {
                        satelitepos = removeha(satelitepos,he.l,he.h)
                        he = randIntExcep(satelitepos)
                    }
                    satelitepos = removeha(satelitepos,he.l,he.h)
                    cells[he.l][he.h] = el.hex
                }
            })
            //



        })



        cells = cells.map((arr) =>arr.map((e) => { 
            return (debug)? tilesName[2] : (Number.isInteger(e))? tilesName[e] : e;
        }))

        console.log(cells);
        // Получение данных сцены напрямую, без использования .data
        let currentScene = game.scenes.current;
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
                if (originalTile == undefined) {
                    ui.notifications.warn("Ненайден тайл с метками: "+ [localTileName,...aditionalTags].join(","))
                    if (mapTiles[tilesName[defaultIndex]]?.isTile != true) {
                        continue;
                    }else{
                        localTileName = mapTiles[tilesName[defaultIndex]].defaulTileName
                    }
                    originalTile = Tagger.getByTag([localTileName,...aditionalTags])[0]
                    if (originalTile == undefined) throw new Error("Даже основной тайл я не смог найти") 
                }
                let newTile = originalTile.clone().toJSON();

                let X = (even_or_odd(posH))?    gridSizeL * mapOffsetL + gridSizeL*posL           : gridSizeL * mapOffsetL + gridSizeL*0.5 + gridSizeL*posL;
                let Y = (even_or_odd(posH))?    gridSizeH * mapOffsetH*Math.sqrt(3)/2  + gridSizeH*posH*Math.sqrt(3)/2 : gridSizeH * mapOffsetH*Math.sqrt(3)/2 + (gridSizeH*Math.sqrt(3)/2)*posH;
                newTile.x = (reverse)? X : Y;
                newTile.y = (reverse)? Y : X;
                if (TileIsPlaced(newTile.x,newTile.y,sceneTiles,gridSize)) {
                    continue;
                }else{
                    newTile.flags.tagger.tags.push(...["mapTile", "canBeDeleted"])
                    newTiles.push(newTile)
                }
            }
        }
        
        await currentScene.createEmbeddedDocuments("Tile", newTiles)

        ui.notifications.info("Заполнение карты завершено")


    } catch (error) {
        ui.notifications.error("что то пошло не так :(")
        console.log(error);
        return 0
    }
    

    
    
} ()