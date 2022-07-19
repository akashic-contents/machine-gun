import * as box2d from "@akashic-extension/akashic-box2d";

/** 2次元ベクトル */
export const b2Vec2 = box2d.Box2DWeb.Common.Math.b2Vec2;
/** 2 × 2 行列 */
export const b2Mat22 = box2d.Box2DWeb.Common.Math.b2Mat22;

/** 衝突判定を持つ銃弾のリスト */
export const bulletList: box2d.EBody[] = [];

/** Aグループ */
export const GROUP_A = -1;
/** Bグループ */
const GROUP_B = -2;
/** 壁カテゴリ */
const CATEGORY_BULLET = 0x0001;
/** 壁カテゴリ */
const CATEGORY_WALL = 0x0002;

/** ダメージ描画に使用するフォント */
export const DAMAGE_FONT = new g.DynamicFont({
	game: g.game,
	fontFamily: "monospace",
	size: 30
});

/** 物理世界のプロパティ */
export const worldProperty = {
	gravity: [0.0, 0.0], // 重力の方向（m/s^2）
	scale: 50, // スケール（pixel/m）
	sleep: true // 停止した物体を演算対象としないかどうか
};
/** 物理エンジンの世界 */
export const physics = new box2d.Box2D(worldProperty);

export interface BulletOrWallParameterObject {
	/** 表示情報のパラメータ */
	appear: {
		assetId?: string;
		width: number;
		height: number;
		cssColor?: string;
	};
	/** 物理定義 */
	physics: {
		/** 物理挙動 */
		body: box2d.Box2DWeb.Dynamics.b2BodyDef;
		/** 物理性質 */
		fixture: box2d.Box2DWeb.Dynamics.b2FixtureDef;
	};
};

/** グループAの銃弾生成パラメータ */
export const bulletParameterA: BulletOrWallParameterObject = {
	/** 見た目情報 */
	appear: {
		assetId: "circleA",
		width: 0.1 * worldProperty.scale,
		height: 0.1 * worldProperty.scale
	},
	/** 物理定義 */
	physics: {
		/** 物理挙動 */
		body: physics.createBodyDef({
			type: box2d.BodyType.Dynamic // 自由に動ける物体
		}),
		/** 物理性質 */
		fixture: physics.createFixtureDef({
			density: 1.0, // 密度
			friction: 0.3, // 摩擦係数
			restitution: 0.7, // 反発係数
			shape: physics.createCircleShape(0.1 * worldProperty.scale), // 衝突判定の形（直径 0.1m の円形）
			filter: {
				// 衝突判定のフィルタリング設定
				// ※ 負のグループに属するオブジェクト同士は衝突しない
				// ※ 物体のcategoryBitsとmaskBitsの論理積が真のときだけ衝突判定が行われる
				groupIndex: GROUP_A,
				categoryBits: CATEGORY_BULLET,
				maskBits: CATEGORY_WALL
			}
		})
	}
};

/** グループBの銃弾生成パラメータ */
export const bulletParameterB: BulletOrWallParameterObject = {
	appear: {
		assetId: "circleB",
		width: 0.1 * worldProperty.scale,
		height: 0.1 * worldProperty.scale
	},
	physics: {
		body: physics.createBodyDef({
			type: box2d.BodyType.Dynamic
		}),
		fixture: physics.createFixtureDef({
			density: 1.0,
			friction: 0.3,
			restitution: 0.7,
			shape: physics.createCircleShape(0.1 * worldProperty.scale),
			filter: {
				groupIndex: GROUP_B,
				categoryBits: CATEGORY_BULLET,
				maskBits: CATEGORY_WALL
			}
		})
	}
};

/** グループAの壁生成パラメータ */
export const wallParameterA: BulletOrWallParameterObject = {
	appear: {
		width: 0.3 * worldProperty.scale,
		height: g.game.height / 3,
		cssColor: "crimson"
	},
	physics: {
		body: physics.createBodyDef({
			type: box2d.BodyType.Static // 固定されて動かない物体
		}),
		fixture: physics.createFixtureDef({
			density: 1.0,
			friction: 0.3,
			restitution: 0.7,
			shape: physics.createRectShape(0.3 * worldProperty.scale, g.game.height / 3),
			filter: {
				groupIndex: GROUP_A,
				categoryBits: CATEGORY_WALL,
				maskBits: CATEGORY_BULLET
			}
		})
	}
};

/** グループBの壁生成パラメータ */
export const wallParameterB: BulletOrWallParameterObject = {
	appear: {
		width: 0.3 * worldProperty.scale,
		height: g.game.height / 3,
		cssColor: "teal"
	},
	physics: {
		body: physics.createBodyDef({
			type: box2d.BodyType.Static
		}),
		fixture: physics.createFixtureDef({
			density: 1.0,
			friction: 0.3,
			restitution: 0.7,
			shape: physics.createRectShape(0.3 * worldProperty.scale, g.game.height / 3),
			filter: {
				groupIndex: GROUP_B,
				categoryBits: CATEGORY_WALL,
				maskBits: CATEGORY_BULLET
			}
		})
	}
};
