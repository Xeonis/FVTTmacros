const tagsToDelete = ["mapTile", "canBeDeleted"];

void async function main() {
    let message = "Очистка текущей карты начата"
    ui.notifications.info(message)
    try {
        const currentScene = game.scenes.current;
        const tiles = Tagger.getByTag(tagsToDelete)
        const tilesId = tiles.map(tile => tile._id)
        if (!tilesId.length) {
            message = "Карта была пустая"
            return 0
        }
        await currentScene.deleteEmbeddedDocuments("Tile", tilesId);
        message = `Карта очищена. Удалено: ${tilesId.length}`
        return 0
    } catch (error) {
        message =  "что то пошло не так :("
        console.log(error);
        return 0
    }finally{
        ui.notifications.info(message)
    }
}()