<template>
  <div class="plugin-config-container">
    <h1 class="page-title">SUMIFプラグイン設定</h1>

    <div class="setting-section">
      <h2 class="section-title">基本設定</h2>
      <div v-if="hasError" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="setting-item">
        <label class="label-text">対象テーブル(SUMIFで集計したいサブテーブル名)<span class="required-mark">*</span></label>
        <select v-model="subtable" @change="subtableChange" :class="{ 'input-error': subtableError }">
          <option value="">-----</option>
          <option v-for="targetSubtable in optionSubtable" :value="targetSubtable.name" :key="targetSubtable.id">
            {{ targetSubtable.name }}
          </option>
        </select>
      </div>

      <div class="setting-item">
        <label class="label-text">集計条件フィールド(集計条件にするフィールド名)<span class="required-mark">*</span></label>
        <select v-model="condition" :class="{ 'input-error': conditionError || conditionDuplicateError }">
          <option value="">-----</option>
          <option v-for="targetConditionField in optionConditionField" :value="targetConditionField.name" :key="targetConditionField.id">
            {{ targetConditionField.name }}
          </option>
        </select>
      </div>

      <div class="setting-item">
        <label class="label-text">集計項目フィールド<span class="required-mark">*</span></label>
        <select v-model="totaling" :class="{ 'input-error': totalingError || totalingDuplicateError }">
          <option value="">-----</option>
          <option v-for="targetTotalingField in optionTotalingField" :value="targetTotalingField.name" :key="targetTotalingField.id">
            {{ targetTotalingField.name }}
          </option>
        </select>
      </div>
    </div>

    <hr class="section-divider" />

    <div class="setting-section">
      <h2 class="section-title">集計条件と集計結果を出力するフィールドを指定</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th class="header-condition-number"><span class="title">No.</span></th>
            <th class="header-condition-value"><span class="title">集計条件</span></th>
            <th class="header-condition-output-field">
              <span class="title">集計結果フィールド</span>
            </th>
            <th class="table-header-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(conditionParameter, index) in conditionParameters" :key="conditionParameter.id">
            <td>{{ index + 1 }}</td>
            <td>
              <input type="text" :id="'condition-value' + (index + 1)" class="text-input" v-model="conditionParameter.conditionValue" :class="{ 'input-error': conditionValueError }" />
            </td>
            <td>
              <select v-model="conditionParameter.outputField" :class="{ 'input-error': outputError }">
                <option value="">-----</option>
                <option v-for="targetOutputField in optionOutputField" :value="targetOutputField.name" :key="targetOutputField.id">
                  {{ targetOutputField.name }}
                </option>
              </select>
            </td>
            <td class="table-actions">
              <button @click="addItem(index)" type="button" class="action-icon-button add-button" title="行を追加"></button>
              <button @click="removeItem(index)" type="button" class="action-icon-button remove-button" title="行を削除"></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="button-group">
      <button @click="register" class="action-button primary-button">登録</button>
      <button @click="cancel" class="action-button secondary-button" type="button"> キャンセル </button>
    </div>

    <div v-if="showSuccessModal" class="custom-modal-overlay">
      <div class="custom-modal">
        <p>プラグインの設定が保存されました！アプリを更新してください！</p>
        <button @click="closeSuccessModal" class="action-button primary-button">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { setDropDown } from '../js/ConditionSumPluginFunction.js';

// 子コンポーネント側で引数を定義
const props = defineProps({
  initialConfig: {
    type: Object, //型
    default: () => ({}), //デフォルト値
  },
  optionSubtable: {
    type: Array,
    default: () => [],
  },
  optionConditionField: {
    type: Array,
    default: () => [],
  },
  optionTotalingField: {
    type: Array,
    default: () => [],
  },
  optionOutputField: {
    type: Array,
    default: () => [],
  },
  conditionsDistributor: {
    type: Function,
    default: () => {},
  },
  totalingDistributor: {
    type: Function,
    default: () => {},
  },
  outputDistributor: {
    type: Function,
    default: () => {},
  },
});

// Vueのリアクティブな変数
const subtable = ref(props.initialConfig.subtable);
const condition = ref(props.initialConfig.condition);
const totaling = ref(props.initialConfig.totaling);

// 集計項目一覧を配列で管理
const conditionParameters = ref(props.initialConfig.conditionParameters);

// ドロップダウンの選択肢
const optionSubtable = ref(props.optionSubtable);
const optionConditionField = ref(props.optionConditionField);
const optionTotalingField = ref(props.optionTotalingField);
const optionOutputField = ref(props.optionOutputField);

// エラー判定用
const subtableError = ref(false);
const conditionError = ref(false);
const totalingError = ref(false);
const conditionDuplicateError = ref(false);
const totalingDuplicateError = ref(false);
const conditionValueError = ref(false);
const outputError = ref(false);
const hasError = ref(false);
const errorMessage = ref('');

// カスタムモーダルの表示用
const showSuccessModal = ref(false);

// --- メソッド定義 ---

/**
 * 全てのバリデーションチェックを実行する
 * @returns {boolean} バリデーションが成功したかどうか
 */
const validate = () => {
  hasError.value = false;
  errorMessage.value = '';

  // 必須入力チェック
  if (!subtable.value) {
    errorMessage.value = '対象テーブルは必須項目です。';
    subtableError.value = true;
    hasError.value = true;
  }
  if (!condition.value) {
    errorMessage.value = '集計条件フィールドは必須項目です。';
    conditionError.value = true;
    hasError.value = true;
  }
  if (!totaling.value) {
    errorMessage.value = '集計項目フィールドは必須項目です。';
    totalingError.value = true;
    hasError.value = true;
  }
  if (hasError.value) {
    return false;
  }

  // 重複チェック (集計条件 vs 集計項目)
  if (condition.value === totaling.value) {
    errorMessage.value = '集計条件と集計項目は同じフィールドを指定できません。';
    conditionDuplicateError.value = true;
    totalingDuplicateError.value = true;
    hasError.value = true;
    return false;
  }

  // 条件値の重複チェック
  const conditionValues = conditionParameters.value.map((item) => item.conditionValue).filter((val) => val !== '');
  if (new Set(conditionValues).size !== conditionValues.length) {
    errorMessage.value = '集計条件が重複しています。';
    conditionValueError.value = true;
    hasError.value = true;
    return false;
  }

  // 集計結果の重複チェック
  const outputValues = conditionParameters.value.map((item) => item.outputField).filter((val) => val !== '');
  if (new Set(outputValues).size !== outputValues.length) {
    errorMessage.value = '集計結果フィールドが重複しています。';
    outputError.value = true;
    hasError.value = true;
    return false;
  }

  // 全てのエラーフラグをリセット
  subtableError.value = false;
  conditionError.value = false;
  totalingError.value = false;
  conditionDuplicateError.value = false;
  totalingDuplicateError.value = false;
  conditionValueError.value = false;
  outputError.value = false;

  return true;
};

const register = () => {
  if (!validate()) {
    return;
  }

  try {
    // kintoneに保存するデータ形式に変換
    const param = {
      subtable: subtable.value,
      condition: condition.value,
      totaling: totaling.value,
      conditionParameters: JSON.stringify(conditionParameters.value),
    };

    // kintone API呼び出し
    kintone.plugin.app.setConfig(param, () => {
      showSuccessModal.value = true;
    });
  } catch (e) {
    console.error('name: ' + e.name + ' message: ' + e.message);
    hasError.value = true;
    errorMessage.value = '設定の保存中にエラーが発生しました。';
  }
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  window.location.href = '/k/admin/app/flow?app=' + kintone.app.getId();
};

const cancel = () => {
  window.location.href = '/k/admin/app/' + kintone.app.getId() + '/plugin/';
};

const addItem = (index) => {
  if (conditionParameters.value.length >= 5) return;
  const newItem = { id: Date.now(), conditionValue: '', outputField: '' };
  conditionParameters.value.splice(index + 1, 0, newItem);
};

const removeItem = (index) => {
  if (conditionParameters.value.length <= 1) return;
  conditionParameters.value.splice(index, 1);
};

// 「対象テーブル」を変更した際のイベント
const subtableChange = (event) => {
  subtable.value = event.target.value;
  // props経由で関数を呼び出す
  let conditionFields = props.conditionsDistributor(subtable.value);
  let numberCalcFields = props.totalingDistributor(subtable.value);
  let numberFields = props.outputDistributor(subtable.value);

  let newOptionConditionField = setDropDown(conditionFields.subtable);
  let newOptionTotalingField = setDropDown(numberCalcFields.subtable);
  let newOptionOutputField = setDropDown(numberFields.outsideSubtable);

  // 値を消して、ドロップダウンの設定内容を更新
  condition.value = '';
  optionConditionField.value = newOptionConditionField;
  totaling.value = '';
  optionTotalingField.value = newOptionTotalingField;
  // conditions配列をリセット
  conditionParameters.value = [{ id: 1, conditionValue: '', outputField: '' }];
  optionOutputField.value = newOptionOutputField;
};
</script>

<style scoped>
/*
  scoped属性を維持しつつ、`:global()`擬似クラスを使って
  詳細度を確保することで、kintoneのCSSに上書きされるのを防ぎます。
  これにより、scopedの利点であるコンポーネント外への影響を避けつつ、
  スタイルを確実に適用できます。
*/
:global(.plugin-config-container) {
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 30px;
  max-width: 1200px;
  margin: 30px auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e7eb;
}

:global(.plugin-config-container .page-title) {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f4f7;
}

:global(.plugin-config-container .section-title) {
  font-size: 20px;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 20px;
  border-left: 4px solid #4a90e2;
  padding-left: 10px;
}

:global(.plugin-config-container .section-divider) {
  border: 0;
  border-top: 1px solid #f0f4f7;
  margin: 30px 0;
}

:global(.plugin-config-container .setting-section) {
  margin-bottom: 30px;
}

:global(.plugin-config-container .setting-item) {
  margin-bottom: 20px;
}

:global(.plugin-config-container .label-text) {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
  font-size: 15px;
}

:global(.plugin-config-container .text-input),
:global(.plugin-config-container select) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  background-color: #fcfdfe;
  font-size: 15px;
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

:global(.plugin-config-container .text-input:focus),
:global(.plugin-config-container select:focus) {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
  outline: none;
  background-color: #ffffff;
}

:global(.plugin-config-container select) {
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  cursor: pointer;
}

:global(.plugin-config-container .input-error) {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2) !important;
}

:global(.plugin-config-container .error-message) {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}

:global(.plugin-config-container .data-table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  border: 1px solid #e0e7eb;
  border-radius: 8px;
  overflow: hidden;
}

:global(.plugin-config-container .data-table th),
:global(.plugin-config-container .data-table td) {
  padding: 12px 15px;
  border: 1px solid #f0f4f7;
  text-align: left;
  vertical-align: middle;
}

:global(.plugin-config-container .data-table th) {
  background-color: #f7f9fb;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

:global(.plugin-config-container .header-condition-number) {
  width: 5%;
}

:global(.plugin-config-container .header-condition-value) {
  width: 40%;
}

:global(.plugin-config-container .header-condition-output-field) {
  width: 40%;
}

:global(.plugin-config-container .table-header-action) {
  width: 15%;
  text-align: center;
}

:global(.plugin-config-container .data-table .text-input),
:global(.plugin-config-container .data-table select) {
  padding: 8px 10px;
  font-size: 14px;
}

:global(.plugin-config-container .table-actions) {
  white-space: nowrap;
  text-align: center;
}

:global(.plugin-config-container .action-icon-button) {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0 5px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

:global(.plugin-config-container .add-button) {
  background-color: #e6f7ff;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%234a90e2%22%20d%3D%22M19%2013h-6v6h-2v-6H5v-2h6V5h2v6h6v2z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px;
}

:global(.plugin-config-container .remove-button) {
  background-color: #ffebeb;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23e74c3c%22%20d%3D%22M19%2013H5v-2h14v2z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px;
}

:global(.plugin-config-container .action-icon-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:global(.plugin-config-container .add-button:hover) {
  background-color: #d1efff;
}

:global(.plugin-config-container .remove-button:hover) {
  background-color: #ffd1d1;
}

:global(.plugin-config-container .button-group) {
  text-align: center;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #f0f4f7;
}

:global(.plugin-config-container .action-button) {
  padding: 12px 30px;
  margin: 0 10px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:global(.plugin-config-container .primary-button) {
  background-color: #4a90e2;
  color: white;
}

:global(.plugin-config-container .primary-button:hover) {
  background-color: #357bd8;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
}

:global(.plugin-config-container .secondary-button) {
  background-color: #eceff1;
  color: #555;
  border: 1px solid #cfd8dc;
}

:global(.plugin-config-container .secondary-button:hover) {
  background-color: #e0e4e6;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
}

:global(.plugin-config-container .required-mark) {
  color: #e74c3c;
  font-weight: bold;
  margin-left: 4px;
}

/* カスタムモーダル */
:global(.custom-modal-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

:global(.custom-modal) {
  background-color: #fff;
  padding: 40px 60px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 90%;
  position: relative;
  border: 1px solid #e0e7eb;
}

:global(.custom-modal p) {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}
</style>
