Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

setSelectedBiome();

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tCliff = g_Terrains.cliff;
const tTier1Terrain = g_Terrains.tier1Terrain;
const tTier2Terrain = g_Terrains.tier2Terrain;
const tTier3Terrain = g_Terrains.tier3Terrain;
const tHill = g_Terrains.hill;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tTier4Terrain = g_Terrains.tier4Terrain;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightLand = 3;

var g_Map = new RandomMap(heightLand, tMainTerrain);

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

var playerPlacements = playerPlacementCircle(fractionToTiles(0.30));

var clPlayers = [];
for (let i = 0; i < numPlayers; ++i) {
	clPlayers[i] = g_Map.createTileClass();
}

placePlayerBasesCustom({
	"PlayerPlacement": playerPlacements,
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken": {
	},
	"Berries": {
		"template": oFruitBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oTree1,
		"count": 5
	},
	"Decoratives": {
		"template": aGrassShort
	}
}, clPlayer, clPlayers);

Engine.SetProgress(20);

createBumps(avoidClasses(clPlayer, 20));

Engine.SetProgress(25);

const biome = currentBiome();

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15), clHill, scaleByMapSize(2, 11));

const [playerIDs, playerPositions, playerAngles] = playerPlacements;

const stoneDistance = 42;
const metalDistance = 42;

for (let i = 0; i < numPlayers; ++i)
{
  arcPlacing(
    i, new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4),
    clRock, avoidClasses(clForest, 10, clHill, 2),
    stoneDistance, 2, isNomad() ? 100 : 30, 400
  );

  arcPlacing(
    i, new SimpleObject(oMetalLarge, 1, 1, 0, 4),
    clMetal, avoidClasses(clForest, 10, clHill, 2, clRock, 5),
    metalDistance, 2, isNomad() ? 100 : 30, 400
  );
}

let constraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clFood, 10);
let stragglerConstraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clBaseResource, 10, clFood, 10);
placeFoodBiomes[biome](playerPlacements, constraints, stragglerConstraints);

Engine.SetProgress(40);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clPlayer, 20, clForest, 18, clHill, 0, clMetal, 4, clRock, 4, clFood, 4),
 clForest,
 forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating stone mines");
createMines(
	[
		[new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)]
	],
	avoidClasses(clForest, 1, clPlayer, 60, clRock, 22, clHill, 1),
	clRock,
  scaleByMapSize(4, 16) - 1
);
Engine.SetProgress(60);

g_Map.log("Creating metal mines");
createMines(
 [
  [new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
 ],
 avoidClasses(clForest, 1, clPlayer, 60, clMetal, 22, clRock, 5, clHill, 1),
 clMetal,
 scaleByMapSize(4, 16) - 1
);

Engine.SetProgress(65);

var planetm = 1;

if (biome == "generic/tropic")
	planetm = 8;

createDecoration(
	[
		[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
		[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
		[new SimpleObject(aGrassShort, 1, 2, 0, 1)],
		[new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3,6, 1.2, 2.5)],
		[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
	],
	[
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	],
	avoidClasses(clForest, 0, clPlayer, 0, clHill, 0));

Engine.SetProgress(70);

let huntGenDistance = 50;

if (oMainHuntableAnimal == 'gaia/fauna_elephant_african_bush') {
  huntGenDistance = 80;
}

// Separate for eles generation being farther
createFood(
  [ [new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)] ],
  [ 2 * numPlayers ],
  avoidClasses(clForest, 0, clPlayer, huntGenDistance, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
  clFood);

createFood(
  [ [new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)] ],
  [ 2 * numPlayers ],
  avoidClasses(clForest, 0, clPlayer, 50, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
  clFood);

Engine.SetProgress(75);

createFood(
  [
    [new SimpleObject(oFruitBush, 5, 7, 0, 4)]
  ],
  [
    2 * numPlayers
  ],
  avoidClasses(clForest, 0, clPlayer, 45, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
  clFood);

Engine.SetProgress(85);

createStragglerTrees(
  [oTree1, oTree2, oTree4, oTree3],
  avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    currentBiome() === "generic/savanna" ? 12 : 38,
    clMetal, 6, clRock, 6, clFood, 1
  ),
  clForest,
  stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

g_Map.ExportMap();
