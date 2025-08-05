(function (PLUGIN_ID) {
  'use strict';
  // Get plugin configuration settings
  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) {
    return false;
  }
  // Get each settings
  const CONFIG_SUBTABLE = CONFIG.subtable;
  const CONFIG_CONDITION = CONFIG.condition;
  const CONFIG_TOTALING = CONFIG.totaling;
  let CONFIG_CONDITION_PARAMETERS = CONFIG.conditionParameters;

  if (!CONFIG_CONDITION_PARAMETERS) {
    //配列→オブジェクトの配列に変換
    CONFIG_CONDITION_PARAMETERS = [{ id: 1, conditionValue: '', outputField: '' }];
  } else {
    CONFIG_CONDITION_PARAMETERS = JSON.parse(CONFIG['conditionParameters']);
  }

  const conditionArray = [];
  for (const item of CONFIG_CONDITION_PARAMETERS) {
    const addItem = {
      条件: item.conditionValue,
      結果フィールド名: item.outputField,
      集計値: 0,
    };
    conditionArray.push(addItem);
  }

  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★　レコード追加画面、編集画面表示
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  kintone.events.on(['app.record.create.show', 'app.record.edit.show', 'app.record.index.edit.show'], (event) => {
    const record = event.record;

    for (const item of conditionArray) {
      if (item.結果フィールド名 && item.結果フィールド名 in record) {
        record[item.結果フィールド名].disabled = true;
        if (event.type == 'app.record.create.show') {
          record[item.結果フィールド名].value = 0;
        }
      }
    }
    return event;
  });

  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  //★
  //★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  kintone.events.on(
    [
      'app.record.create.change.' + CONFIG_CONDITION,
      'app.record.edit.change.' + CONFIG_CONDITION,
      'app.record.create.change.' + CONFIG_TOTALING,
      'app.record.edit.change.' + CONFIG_TOTALING,
      'app.record.create.change.' + CONFIG_SUBTABLE,
      'app.record.edit.change.' + CONFIG_SUBTABLE,
    ],
    (event) => {
      try {
        for (const condition of conditionArray) {
          condition.集計値 = 0;
        }

        const record = event.record;
        for (const row of record[CONFIG_SUBTABLE].value) {
          const 集計条件 = row.value[CONFIG_CONDITION].value;
          const 集計項目 = row.value[CONFIG_TOTALING].value;
          //集計条件、集計項目フィールドともに入力済かつ集計項目フィールドが数値の場合、集計する。
          if (集計条件 != null && 集計条件 !== '' && 集計項目 != null && 集計項目 !== '' && !isNaN(集計項目)) {
            for (const condition of conditionArray) {
              if (集計条件 == condition.条件) {
                condition.集計値 += Number(集計項目);
              }
            }
          }
        }

        for (const condition of conditionArray) {
          record[condition.結果フィールド名].value = condition.集計値;
        }
      } catch (e) {
        console.error('name: ' + e.name + '  message: ' + e.message);
        event.error = e.message;
      } finally {
        return event;
      }
    }
  );
})(kintone.$PLUGIN_ID);
