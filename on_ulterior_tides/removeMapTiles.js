const tagsToDelete = ["mapTile", "canBeDeleted"];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

void async function main() {
    ui.notifications.info("Очистка текущей карты начата")
// the timeout for next parts, for keep the messages order
    await sleep(2000);
    try {
        const currentScene = game.scenes.current;
        const tiles = Tagger.getByTag(tagsToDelete)
        const tilesId = tiles.map(tile => tile._id)
        if (!tilesId.length) {
            ui.notifications.info("Карта была пустая")
            return 0
        }
        await currentScene.deleteEmbeddedDocuments("Tile", tilesId);
        ui.notifications.info(`Карта очищена. Удалено: ${tilesId.length} ячеек`)
        return 0
    } catch (error) {
        ui.notifications.error("что то пошло не так :(")
        console.log(error);
        return 0
    }
}()

// the timeout for possible next script in chain executions
await sleep(10000);
