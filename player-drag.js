const field = document.getElementById('field');
const players = document.querySelectorAll('.player');

let activePlayer = null;
let offsetX = 0;
let offsetY = 0;

// すべての選手のコマにイベントリスナーを追加
players.forEach((player) => {
  player.addEventListener('mousedown', startDrag);
});

function startDrag(e) {
  // ドラッグ対象の選手を設定
  activePlayer = e.target;
  activePlayer.classList.add('dragging');

  // マウスカーソルと選手の左上隅との差分を計算
  const rect = activePlayer.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  // マウスを動かした時、離した時のイベントを登録
  document.addEventListener('mousemove', dragPlayer);
  document.addEventListener('mouseup', stopDrag);
}

function dragPlayer(e) {
  if (!activePlayer) return; // ドラッグ中でなければ何もしない

  // フィールドの左上隅を基準としたマウスの座標を計算
  const fieldRect = field.getBoundingClientRect();
  let newLeft = e.clientX - fieldRect.left - offsetX;
  let newTop = e.clientY - fieldRect.top - offsetY;

  // 選手がフィールドの外にはみ出ないように位置を制限
  const boardWidth = field.clientWidth;
  const boardHeight = field.clientHeight;
  const playerWidth = activePlayer.offsetWidth;
  const playerHeight = activePlayer.offsetHeight;

  newLeft = Math.max(0, Math.min(newLeft, boardWidth - playerWidth));
  newTop = Math.max(0, Math.min(newTop, boardHeight - playerHeight));

  // 選手の位置を更新
  activePlayer.style.left = `${newLeft}px`;
  activePlayer.style.top = `${newTop}px`;
}

function stopDrag() {
  if (!activePlayer) return;

  activePlayer.classList.remove('dragging');
  activePlayer = null; // ドラッグ対象をリセット

  // 不要になったイベントを削除（重要！）
  document.removeEventListener('mousemove', dragPlayer);
  document.removeEventListener('mouseup', stopDrag);
}
