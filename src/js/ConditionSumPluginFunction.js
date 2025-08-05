('use strict');

//★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ドロップダウン共通
//★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
function setDropDown(fieldArray) {
  const result = [];
  for (const field of fieldArray) {
    const addItem = {
      id: field.code,
      name: escapeHtml(field.code),
    };
    result.push(addItem);
  }
  return result;
}

//エスケープ文字の置換
function escapeHtml(htmlstr) {
  return htmlstr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

//★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
/** サブテーブル外のフィールドと、指定したサブテーブル内のフィールドに振分ける
 * @param {array} all - フィールドの一覧
 * @returns {function} サブテーブル名を引数として、該当サブテーブル内のフィールドとサブテーブル以外のフィールドの一覧を返す関数(クロージャ)
 */
//★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
const サブテーブルフィールド振分 = (all) => {
  const allFieldArray = Object.freeze(all);
  return (subtableName) => {
    const resultOutsideSubtable = [];
    const resultSubtable = [];
    for (const item of allFieldArray) {
      if (!item.hasOwnProperty('subtableCode')) {
        resultOutsideSubtable.push(item);
      } else if (item.subtableCode == subtableName) {
        resultSubtable.push(item);
      }
    }
    return {
      outsideSubtable: resultOutsideSubtable, //サブテーブル外のフィールド
      subtable: resultSubtable, //指定されたサブフィールド内のフィールド
    };
  };
};

export { setDropDown, escapeHtml, サブテーブルフィールド振分 };
