
Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("balancedHelpers");

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
const tWater = g_Terrains.water;
const tShore = g_Terrains.shore;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFish = g_Gaia.fish;
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

const heightLand = 0;

var g_Map = new RandomMap(heightLand, tMainTerrain);
const mapSize = g_Map.getSize();
const halfMapSize = g_Map.getSize() / 2;

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clRamp = g_Map.createTileClass();
var clWater = g_Map.createTileClass();

const playerDistance = fractionToTiles(0.6);
const playerEdgeDistance = Math.round((mapSize - playerDistance) / 2);
const playerPositions = [new Vector2D(halfMapSize, playerEdgeDistance), new Vector2D(halfMapSize, playerEdgeDistance + playerDistance)];
const playerPlacements = [sortAllPlayers(), playerPositions];

placePlayerBases({
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
});

Engine.SetProgress(10);

const heightTop = heightLand + 5;
const lowlandsWidth = fractionToTiles(0.4);
const rampWidth = fractionToTiles(0.05);
const elevationPainter = new ElevationPainter(heightTop);

const rightPlateauPlacer = new RectPlacer(new Vector2D(halfMapSize + lowlandsWidth / 2 + rampWidth, mapSize), new Vector2D(mapSize, 0));
const leftPlateauPlacer = new RectPlacer(new Vector2D(0, mapSize), new Vector2D(halfMapSize - lowlandsWidth / 2 - rampWidth, 0));

createArea(rightPlateauPlacer, elevationPainter);
Engine.SetProgress(12);
createArea(leftPlateauPlacer, elevationPainter);
Engine.SetProgress(14);

createPassage({
  "start": new Vector2D(halfMapSize + lowlandsWidth / 2, halfMapSize),
  "end": new Vector2D(halfMapSize + rampWidth + lowlandsWidth / 2, halfMapSize),
  "startWidth": mapSize,
  "endWidth": mapSize,
  "smoothWidth": 2,
  "tileClass": clRamp,
  "terrain": tCliff,
  "edgeTerrain": tHill
});
Engine.SetProgress(16);

createPassage({
  "start": new Vector2D(halfMapSize - lowlandsWidth / 2, halfMapSize),
  "end": new Vector2D(halfMapSize - rampWidth - lowlandsWidth / 2, halfMapSize),
  "startWidth": mapSize,
  "endWidth": mapSize,
  "smoothWidth": 2,
  "tileClass": clRamp,
  "terrain": tCliff,
  "edgeTerrain": tHill
});
Engine.SetProgress(18);

const heightWaterLevel = heightTop - 7;

function createSideLakes(xDistance, yDistance) {
  const stoneRight = randBool();
  let mineralDistribution = [stoneRight, !stoneRight];

  for (let x of [halfMapSize + xDistance, halfMapSize - xDistance]) {
    const position = new Vector2D(x, halfMapSize + yDistance);
    const lakeSize = 22;
    const placer = new ChainPlacer(
      2,
      Math.floor(scaleByMapSize(3, 8)),
      Math.floor(scaleByMapSize(8, 20)),
      Infinity,
      position,
      0,
      [lakeSize]
    );

    createArea(
      placer,
      [
        new SmoothElevationPainter(ELEVATION_SET, heightWaterLevel - 3, 4),
        new TileClassPainter(clWater),
      ],
      new NullConstraint()
    );

    let fish = new SimpleGroup(
      [new SimpleObject(oFish, 2, 2, 0, 2)],
      true,
      clFood
    );

    createObjectGroupsByAreas(fish, 0,
      new AndConstraint([avoidClasses(clFood, 6), stayClasses(clWater, 2)]),
      5, 1000, [new Area(placer.place(new NullConstraint()))]
    );

    let mineralPlacer = new AnnulusPlacer(22, 26, position).place(
      new AndConstraint([avoidClasses(clForest, 10, clHill, 2, clWater, 4)])
    );
    let surroundingArea = new Area(mineralPlacer);

    if (mineralDistribution.pop()) {
      let stone = new SimpleGroup(
        [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
        true,
        clRock
      );

      createObjectGroupsByAreas(stone, 0,
        new NullConstraint(),
        1, 400, [surroundingArea]
      );
    } else {
      let metal = new SimpleGroup(
        [new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
        true,
        clRock
      );

      createObjectGroupsByAreas(metal, 0,
        avoidClasses(clRock, 6),
        1, 400, [surroundingArea]
      );
    }
  }
}

const lakeDistance = rampWidth + lowlandsWidth / 2 + fractionToTiles(0.11);

createSideLakes(lakeDistance, fractionToTiles(0.31));
Engine.SetProgress(22);
createSideLakes(lakeDistance, -fractionToTiles(0.31));
Engine.SetProgress(24);

createArea(
  leftPlateauPlacer,
  new TerrainPainter(tWater),
  new HeightConstraint(-Infinity, heightTop - 1.5));
Engine.SetProgress(26);
createArea(
  leftPlateauPlacer,
  new TerrainPainter(tShore),
  new HeightConstraint(heightTop - 1, heightTop - 2));
Engine.SetProgress(27);

createArea(
  rightPlateauPlacer,
  new TerrainPainter(tWater),
  new HeightConstraint(-Infinity, heightTop - 1.5));
Engine.SetProgress(28);
createArea(
  rightPlateauPlacer,
  new TerrainPainter(tShore),
  new HeightConstraint(heightTop - 1, heightTop - 2));
Engine.SetProgress(29);

createBumps(avoidClasses(clPlayer, 20));

Engine.SetProgress(30);

let placer = new DiskPlacer(4, new Vector2D(mapSize / 2, mapSize / 2)).place(
  new NullConstraint()
);
let centerMineralsArea = new Area(placer);

let stone = new SimpleGroup(
  [new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
  true,
  clRock
);

let metal = new SimpleGroup(
  [new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
  true,
  clRock
);

createObjectGroupsByAreas(stone, 0,
  new NullConstraint(),
  1, 400, [centerMineralsArea]
);

createObjectGroupsByAreas(metal, 0,
  avoidClasses(clRock, 6),
  1, 400, [centerMineralsArea]
);
Engine.SetProgress(32);

if (randBool())
  createHills([tCliff, tCliff, tHill], avoidClasses(clPlayer, 35, clHill, 15, clMetal, 4, clRock, 4, clWater, 8), clHill, scaleByMapSize(2, 11));
else
  createMountains(tCliff, avoidClasses(clPlayer, 35, clHill, 15, clMetal, 4, clRock, 4, clWater, 8), clHill, scaleByMapSize(2, 11));

Engine.SetProgress(34);

let constraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clFood, 10);
let stragglerConstraints = avoidClasses(clHill, 1, clMetal, 4, clRock, 4, clBaseResource, 10, clFood, 10);

placeBalancedFood(playerPlacements, constraints, stragglerConstraints, 0.5);

Engine.SetProgress(40);

if (currentBiome() != "generic/savanna") {
  createBalancedPlayerForests(
   playerPositions,
   avoidClasses(clForest, 18, clHill, 1, clMetal, 4, clRock, 4, clFood, 4),
   clForest);
}

Engine.SetProgress(44);

const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
const leftPlateauArea = new Area(leftPlateauPlacer.place(avoidClasses(clWater, 4)));
const rightPlateauArea = new Area(rightPlateauPlacer.place(avoidClasses(clWater, 4)));
const plateauTrees = Math.round(forestTrees / 2);

createForestsInArea(
 leftPlateauArea,
 avoidClasses(clForest, 18, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clWater, 3),
 clForest,
 plateauTrees,
 2);

Engine.SetProgress(48);

createForestsInArea(
 rightPlateauArea,
 avoidClasses(clForest, 18, clHill, 1, clMetal, 4, clRock, 4, clFood, 4, clWater, 3),
 clForest,
 plateauTrees,
 2);

Engine.SetProgress(52);

const lowlandsPlacer = new RectPlacer(new Vector2D(halfMapSize - lowlandsWidth / 2, 0), new Vector2D(halfMapSize + lowlandsWidth / 2, mapSize));
const lowlandsArea = new Area(lowlandsPlacer.place(avoidClasses(clPlayer, 40)));

createForestsInArea(
 lowlandsArea,
 avoidClasses(clForest, 18, clHill, 1, clMetal, 4, clRock, 4, clFood, 4),
 clForest,
 plateauTrees / 2,
 1,
 2
);
Engine.SetProgress(55);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

Engine.SetProgress(57);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(59);
//
//g_Map.log("Creating stone mines");
//createMines(
//	[
//		[new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)]
//	],
//	avoidClasses(clForest, 1, clPlayer, 60, clRock, 22, clHill, 1),
//	clRock,
//  scaleByMapSize(4, 16) - 1
//);
//Engine.SetProgress(60);
//
//g_Map.log("Creating metal mines");
//createMines(
// [
//  [new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
// ],
// avoidClasses(clForest, 1, clPlayer, 60, clMetal, 22, clRock, 5, clHill, 1),
// clMetal,
// scaleByMapSize(4, 16) - 1
//);
//
//Engine.SetProgress(65);
//
var planetm = 1;

if (currentBiome() == "generic/tropic")
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

Engine.SetProgress(62);

createBadFood(avoidClasses(clForest, 0, clHill, 1, clMetal, 4, clRock, 4, clFood, 20, clWater, 10));

Engine.SetProgress(67);
//
//Engine.SetProgress(75);
//
//createFood(
//  [
//    [new SimpleObject(oFruitBush, 5, 7, 0, 4)]
//  ],
//  [
//    2 * numPlayers
//  ],
//  avoidClasses(clForest, 0, clPlayer, 45, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
//  clFood);
//
//Engine.SetProgress(85);
//
createStragglerTrees(
  [oTree1, oTree2, oTree4, oTree3],
  avoidClasses(
    clForest, 8, clHill, 1, clPlayer,
    (currentBiome() == "generic/savanna") ? 12 : 30,
    clMetal, 6, clRock, 6, clFood, 1, clWater, 4
  ),
  clForest,
  stragglerTrees);

Engine.SetProgress(75);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

g_Map.ExportMap();