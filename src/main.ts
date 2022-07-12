import * as box2d from "@akashic-extension/akashic-box2d";

/** 2次元ベクトル */
const b2Vec2 = box2d.Box2DWeb.Common.Math.b2Vec2;
/** 2 × 2 行列 */
const b2Mat22 = box2d.Box2DWeb.Common.Math.b2Mat22;

/** Aグループ */
const GROUP_A = -1;
/** Bグループ */
const GROUP_B = -2;
/** 壁カテゴリ */
const CATEGORY_BULLET = 0x0001;
/** 壁カテゴリ */
const CATEGORY_WALL = 0x0002;

/** ダメージ描画に使用するフォント */
const DAMAGE_FONT = new g.DynamicFont({
	game: g.game,
	fontFamily: "monospace",
	size: 30
});

/** 物理世界のプロパティ */
const worldProperty = {
	gravity: [0.0, 0.0], // 重力の方向（m/s^2）
	scale: 50, // スケール（pixel/m）
	sleep: true // 停止した物体を演算対象としないかどうか
};
/** 物理エンジンの世界 */
const physics = new box2d.Box2D(worldProperty);


interface BulletOrWallParameterObject {
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
const bulletParameterA = {
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
const bulletParameterB = {
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
const wallParameterA = {
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
const wallParameterB = {
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

/** 衝突判定を持つ銃弾のリスト */
const bulletList: box2d.EBody[] = [];
/** 衝突した物体のUserDataリスト */
const contactDataList: {a: any; b: any}[] = [];

/** 衝突イベントのリスナ */
const contactListener = new box2d.Box2DWeb.Dynamics.b2ContactListener();
// 衝突開始時のイベントリスナを設定
contactListener.BeginContact = (contact) => {
	// userDataの組を保存しておく
	const a = contact.GetFixtureA().GetBody();
	const b = contact.GetFixtureB().GetBody();

	contactDataList.push({ a: a.GetUserData(), b: b.GetUserData() });
};
// イベントリスナを設定
physics.world.SetContactListener(contactListener);

function main(): void {
	const scene = new g.Scene({ game: g.game, assetIds: ["circleA", "circleB"] });

	scene.onLoad.add(function() {
		const gameCenter = calcCenter(g.game);
		const position = gameCenter.Copy();
		// 壁Aを生成
		const wallA = createRect(scene, wallParameterA);
		position.x -= 1.0;
		wallA.b2Body.SetPosition(position);
		// 壁Bを生成
		const wallB = createRect(scene, wallParameterB);
		position.x += 2.0;
		wallB.b2Body.SetPosition(position);

		/** 画面をタッチしているか */
		let touch = false;
		/** タッチしている座標 */
		let touchPosition: box2d.Box2DWeb.Common.Math.b2Vec2;

		// 画面をタッチしている間、タッチ座標を追う
		scene.onPointDownCapture.add((event) => {
			touch = true;
			touchPosition = physics.vec2(event.point.x, event.point.y);
		});
		scene.onPointMoveCapture.add((event) => {
			const delta = physics.vec2(event.prevDelta.x, event.prevDelta.y);
			touchPosition.Add(delta);
		});
		scene.onPointUpCapture.add(function() {
			touch = false;
		});

		/** フレームカウント（銃弾の発射間隔に使用） */
		let frameCount = 0;
		scene.onUpdate.add(function() {
			// 画面をタッチしている間、銃弾を発射
			if (touch) {
				// 画面左側をタッチしている場合はグループAの銃弾、右側はグループBの銃弾
				if (touchPosition.x < gameCenter.x) {
					// 1 / 3 Fで銃弾発射
					if (2 <= frameCount++) {
						frameCount = 0;
						shootA(scene, touchPosition);
					}
				} else {
					// 1 / 6 Fで銃弾発射
					if (5 <= frameCount++) {
						frameCount = 0;
						shootB(scene, touchPosition);
					}
				}
			}

			// 衝突した銃弾を処理する
			while (0 < contactDataList.length) {
				const data = contactDataList.pop();
				for (let i = 0; i < bulletList.length; ++i) {
					const bullet = bulletList[i];
					const bulletData = bullet.b2Body.GetUserData();
					// UserDataから衝突した銃弾を特定する
					if (data.a.id === bullet.entity.id || data.b.id === bullet.entity.id) {
						const position = bullet.b2Body.GetPosition().Copy();
						position.Multiply(worldProperty.scale);

						// グループによってダメージ表示の色を変更
						const filter = bullet.b2Body.GetFixtureList().GetFilterData();
						const color = filter.groupIndex === GROUP_A ? "crimson" : "teal";
						scene.append(createDamage(scene, position, bulletData.damage, color));

						removeBullet(bullet);
						--i; // 消した分インデックスを詰める
					}
				}
			}

			// 物理エンジンの世界をすすめる
			// ※ step関数の引数は秒数なので、1フレーム分の時間（1.0 / g.game.fps）を指定する
			physics.step(1.0 / g.game.fps);
		});
	});

	g.game.pushScene(scene);
}

/**
 * グループAの銃弾を発射します
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 発射座標
 */
function shootA(scene: g.Scene, position: box2d.Box2DWeb.Common.Math.b2Vec2): void {
	const bullet = createBullet(scene, bulletParameterA);
	bullet.b2Body.SetPosition(position);

	/** 発射制度 */
	const accuracy = 10;
	/** 発射角度（右から -10° ~ 10°） */
	const angle = g.game.random.generate() * accuracy * 2 - accuracy;
	/** 発射の瞬間の力 */
	const impulse = new b2Vec2(0.1, 0);
	impulse.MulM(b2Mat22.FromAngle((angle / 180) * Math.PI));

	// 発射
	bullet.b2Body.ApplyImpulse(impulse, bullet.b2Body.GetPosition());
}
/**
 * グループBの銃弾を発射します
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 発射座標
 */
function shootB(scene: g.Scene, position: box2d.Box2DWeb.Common.Math.b2Vec2): void {
	const bullet = createBullet(scene, bulletParameterB);
	bullet.b2Body.SetPosition(position);
	/** 発射制度 */
	const accuracy = 3;
	/** 発射角度（右から -3° ~ 3°） */
	const angle = g.game.random.generate() * accuracy * 2 - accuracy;
	/** 発射の瞬間の力 */
	const impulse = new b2Vec2(-0.2, 0);
	impulse.MulM(b2Mat22.FromAngle((angle / 180) * Math.PI));

	// 発射
	bullet.b2Body.ApplyImpulse(impulse, bullet.b2Body.GetPosition());
}

/**
 * 衝突判定を持つ矩形を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {Object} parameter 矩形の生成パラメータ
 */
function createRect(scene: g.Scene, parameter: BulletOrWallParameterObject): box2d.EBody {
	// 表示用の矩形（1m × 1m）を生成
	const rect = new g.FilledRect({
		scene: scene,
		width: parameter.appear.width,
		height: parameter.appear.height,
		cssColor: parameter.appear.cssColor
	});
	scene.append(rect);

	// 表示用の矩形と衝突判定を結び付けて返す
	return physics.createBody(rect, parameter.physics.body, parameter.physics.fixture);
}

/**
 * 衝突判定を持った銃弾を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {Object} parameter 銃弾の生成パラメータ
 */
function createBullet(scene: g.Scene, parameter: BulletOrWallParameterObject): box2d.EBody {
	// 表示用の画像を生成
	// ※ AkashicEngineでは円を描画することができないので、画像で表現する
	const entity = new g.Sprite({
		scene: scene,
		src: scene.asset.getImageById(parameter.appear.assetId),
		srcWidth: 100,
		srcHeight: 100,
		width: parameter.appear.width,
		height: parameter.appear.height
	});
	scene.append(entity);

	// 表示用の円形と衝突判定を結び付けて生成
	const bullet = physics.createBody(entity, parameter.physics.body, parameter.physics.fixture);

	/** ダメージの揺らぎ（-5.0 ~ 5.0） */
	const rand = g.game.random.generate() * 10.0 - 5.0;
	// ユーザーデータにダメージを付与する
	bullet.b2Body.SetUserData({
		id: entity.id,
		damage: 20.0 + rand
	});

	// 3 秒後には何があろうと削除
	scene.setTimeout(removeBullet.bind(this, bullet), 3000);

	bulletList.push(bullet);

	return bullet;
}

/**
 * 銃弾を削除する
 * @param {EBody} bullet 削除する銃弾
 */
function removeBullet(bullet: box2d.EBody): void {
	if (bullet.entity.destroyed()) {
		return; // 二重で削除しない
	}
	bulletList.splice(bulletList.indexOf(bullet), 1);
	physics.removeBody(bullet);

	bullet.entity.destroy();
}

/**
 * ダメージ表示を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 表示座標
 * @param {number} damage ダメージ量
 * @param {string} color 描画色
 */
function createDamage(
	scene: g.Scene,
	position: box2d.Box2DWeb.Common.Math.b2Vec2,
	damage: number,
	color: string
): g.Label {
	const label = new g.Label({
		scene: scene,
		font: DAMAGE_FONT,
		text: damage.toFixed(1).toString(),
		fontSize: damage,
		textColor: color,
		x: position.x,
		y: position.y
	});
	label.onUpdate.add(function() {
		// 徐々に透過、完全に透明になったら削除
		label.opacity -= 0.05;
		if (label.opacity <= 0.0) {
			label.destroy();
		}
	});
	return label;
}

/**
 * オブジェクトの中心座標を計算する
 * @param {Object} obj 中心座標を計算するオブジェクト
 */
function calcCenter(obj: g.Game | g.E): box2d.Box2DWeb.Common.Math.b2Vec2 {
	return physics.vec2(obj.width / 2, obj.height / 2);
}

export = main;
