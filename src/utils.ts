import type * as box2d from "@akashic-extension/akashic-box2d";
import * as params from "./parameters";
import type { BulletOrWallParameterObject } from "./parameters";

/**
 * グループAの銃弾を発射します
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 発射座標
 */
export function shootA(scene: g.Scene, position: box2d.Box2DWeb.Common.Math.b2Vec2): void {
	const bullet = createBullet(scene, params.bulletParameterA);
	bullet.b2Body.SetPosition(position);

	/** 発射制度 */
	const accuracy = 10;
	/** 発射角度（右から -10° ~ 10°） */
	const angle = g.game.random.generate() * accuracy * 2 - accuracy;
	/** 発射の瞬間の力 */
	const impulse = new params.b2Vec2(0.1, 0);
	impulse.MulM(params.b2Mat22.FromAngle((angle / 180) * Math.PI));

	// 発射
	bullet.b2Body.ApplyImpulse(impulse, bullet.b2Body.GetPosition());
}

/**
 * グループBの銃弾を発射します
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 発射座標
 */
export function shootB(scene: g.Scene, position: box2d.Box2DWeb.Common.Math.b2Vec2): void {
	const bullet = createBullet(scene, params.bulletParameterB);
	bullet.b2Body.SetPosition(position);
	/** 発射制度 */
	const accuracy = 3;
	/** 発射角度（右から -3° ~ 3°） */
	const angle = g.game.random.generate() * accuracy * 2 - accuracy;
	/** 発射の瞬間の力 */
	const impulse = new params.b2Vec2(-0.2, 0);
	impulse.MulM(params.b2Mat22.FromAngle((angle / 180) * Math.PI));

	// 発射
	bullet.b2Body.ApplyImpulse(impulse, bullet.b2Body.GetPosition());
}

/**
 * 衝突判定を持った銃弾を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {BulletOrWallParameterObject} parameter 銃弾の生成パラメータ
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
	const bullet = params.physics.createBody(entity, parameter.physics.body, parameter.physics.fixture);

	/** ダメージの揺らぎ（-5.0 ~ 5.0） */
	const rand = g.game.random.generate() * 10.0 - 5.0;
	// ユーザーデータにダメージを付与する
	bullet.b2Body.SetUserData({
		id: entity.id,
		damage: 20.0 + rand
	});

	// 3 秒後には何があろうと削除
	scene.setTimeout(removeBullet.bind(this, bullet), 3000);

	params.bulletList.push(bullet);

	return bullet;
}

/**
 * 銃弾を削除する
 * @param {EBody} bullet 削除する銃弾
 */
export function removeBullet(bullet: box2d.EBody): void {
	if (bullet.entity.destroyed()) {
		return; // 二重で削除しない
	}
	params.bulletList.splice(params.bulletList.indexOf(bullet), 1);
	params.physics.removeBody(bullet);

	bullet.entity.destroy();
}

/**
 * 衝突判定を持つ矩形を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {BulletOrWallParameterObject} parameter 矩形の生成パラメータ
 */
export function createRect(scene: g.Scene, parameter: BulletOrWallParameterObject): box2d.EBody {
	// 表示用の矩形（1m × 1m）を生成
	const rect = new g.FilledRect({
		scene: scene,
		width: parameter.appear.width,
		height: parameter.appear.height,
		cssColor: parameter.appear.cssColor
	});
	scene.append(rect);

	// 表示用の矩形と衝突判定を結び付けて返す
	return params.physics.createBody(rect, parameter.physics.body, parameter.physics.fixture);
}

/**
 * ダメージ表示を生成する
 * @param {g.Scene} scene 描画を行うシーン
 * @param {b2Vec2} position 表示座標
 * @param {number} damage ダメージ量
 * @param {string} color 描画色
 */
export function createDamage(
	scene: g.Scene,
	position: box2d.Box2DWeb.Common.Math.b2Vec2,
	damage: number,
	color: string
): g.Label {
	const label = new g.Label({
		scene: scene,
		font: params.DAMAGE_FONT,
		text: damage.toFixed(1).toString(),
		fontSize: damage,
		textColor: color,
		x: position.x,
		y: position.y
	});
	label.onUpdate.add(() => {
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
 * @param {g.Game | g.E} obj 中心座標を計算するオブジェクト
 */
export function calcCenter(obj: g.Game | g.E): box2d.Box2DWeb.Common.Math.b2Vec2 {
	return params.physics.vec2(obj.width / 2, obj.height / 2);
}
