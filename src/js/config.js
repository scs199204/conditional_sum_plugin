// Vueの createApp をインポート
import { createApp } from 'vue';
// 作成したVueコンポーネントをインポート
import ConditionalSumPluginConfigApp from '../components/ConditionalSumPluginConfigApp.vue';
import { setDropDown, サブテーブルフィールド振分 } from './ConditionSumPluginFunction.js';

(async (PLUGIN_ID) => {
  'use strict';
  const config = kintone.plugin.app.getConfig(PLUGIN_ID); //分割代入
  let { subtable, condition, totaling, conditionParameters } = config;

  if (!subtable) subtable = '';
  if (!condition) condition = '';
  if (!totaling) totaling = '';

  if (!conditionParameters) {
    conditionParameters = [{ id: 1, conditionValue: '', outputField: '' }];
  } else {
    // JSON.parse は await より前に行う
    conditionParameters = JSON.parse(config['conditionParameters']);
  }

  const subtableFields = await KintoneConfigHelper.getFields('SUBTABLE');
  const numberAllFields = await KintoneConfigHelper.getFields(['NUMBER']);
  const numberCalcAllFields = await KintoneConfigHelper.getFields(['NUMBER', 'CALC']);
  const conditionAllFields = await KintoneConfigHelper.getFields(['SINGLE_LINE_TEXT', 'NUMBER', 'RADIO_BUTTON', 'DROP_DOWN']);

  const optionSubtable = setDropDown(subtableFields); // 共通関数から生成した関数を定数として定義

  const 条件項目振分関数 = サブテーブルフィールド振分(conditionAllFields);
  const 集計項目振分関数 = サブテーブルフィールド振分(numberCalcAllFields);
  const 結果項目振分関数 = サブテーブルフィールド振分(numberAllFields);

  let conditionFields = 条件項目振分関数(subtable);
  let numberCalcFields = 集計項目振分関数(subtable);
  let numberFields = 結果項目振分関数(subtable);

  let optionConditionField = setDropDown(conditionFields.subtable);
  let optionTotalingField = setDropDown(numberCalcFields.subtable);
  let optionOutputField = setDropDown(numberFields.outsideSubtable);

  const initialConfig = {
    subtable,
    condition,
    totaling,
    conditionParameters,
  };

  let appElement = document.getElementById('app');
  if (!appElement) {
    appElement = document.createElement('div');
    appElement.id = 'app';
    document.body.appendChild(appElement);
  }

  const app = createApp(ConditionalSumPluginConfigApp, {
    initialConfig: initialConfig,
    optionSubtable: optionSubtable,
    optionConditionField: optionConditionField,
    optionTotalingField: optionTotalingField,
    optionOutputField: optionOutputField,
    conditionsDistributor: 条件項目振分関数,
    totalingDistributor: 集計項目振分関数,
    outputDistributor: 結果項目振分関数,
  });
  const vm = app.mount('#app');
})(kintone.$PLUGIN_ID);
