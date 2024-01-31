const tagsToDelete = ["mapTile", "canBeDeleted"];

void async function main() {
    ui.notifications.info("Очистка текущей карты начата")
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