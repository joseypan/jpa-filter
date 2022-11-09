/**
 * @FileDescription: 根据传递的表单，判断当前填写的数据，生成对应的list查询数据
 * @Author: 潘旭敏
 * @Date: 2022-02-08
 * @LastEditors: 潘旭敏
 * @LastEditTime: 2022-02-08 15:56
 */
// 测试用例
// const basicQueryInfo ={
//   workerType:"Teacher",
//   deviceName:"设备1"
// };
// 表单数据
// const queryForm = {
//   name: "123",
//   age: 0,
//   register: false,
//   plateNo: "",
//   enterTime: new Date(),
//   startTime: new Date(), //null,
//   endTime: null, //"2022-02-18"
// };

//map结构(以组合条件为出发点)
// const filterRelationList:IFilterMap[] = [
//   {
//     operator: LogicOperatorEnum.OR, //"OR"
//     targetField: "",
//     validWhen: true,
//     children: [
//       {
//         operator: FilterComparatorEnum.EQ,
//         targetField: "workerType",
//         validWhen: true,
//         children: null,
//         directValue:basicQueryInfo.workerType
//       },
//       {
//         operator: FilterComparatorEnum.CONTAINS,
//         targetField: "deviceName",
//         validWhen: true,
//         children: null,
//         directValue:basicQueryInfo.deviceName
//       },
//     ],
//   },
//   {
//     operator: LogicOperatorEnum.AND, //"OR"
//     targetField: "",
//     validWhen: true,
//     children: [
//       {
//           operator: FilterComparatorEnum.CONTAINS,
//           targetField: "name",
//           validWhen: true,
//           children: null,
//         },
//         {
//           operator: FilterComparatorEnum.EQ,
//           targetField: "age",
//           validWhen: true,
//           children: null,
//         },
//     ],
//   },
//   {
//     operator: LogicOperatorEnum.OR, //"OR"
//     targetField: "",
//     validWhen: true,
//     children: [
//       {
//           operator: FilterComparatorEnum.EQ,
//           targetField: "register",
//           validWhen: true,
//           children: null,
//         },
//         {
//           operator: FilterComparatorEnum.EQ,
//           targetField: "plateNo",
//           validWhen: true,
//           children: null,
//         },
//         {
//           operator: LogicOperatorEnum.OR, //"OR"
//           targetField: "",
//           validWhen: (formData: IQueryForm) => {
//             if (formData.enterTime) return true;
//           },
//           children: [
//             {
//               operator: FilterComparatorEnum.EQ,
//               targetField: "enter",
//               validWhen: true,
//               children: null,
//               directValue: false,
//             },
//             {
//               operator: FilterComparatorEnum.GT,
//               targetField: "time",
//               validWhen: true,
//               children: null,
//               formFieldName: "enterTime",
//             },
//           ],
//         },
//         {
//           operator: FilterComparatorEnum.BETWEEN,
//           targetField: "belongTime",
//           validWhen: true,
//           children: null,
//           formFieldName: ["startTime", "endTime"],
//         },
//     ],
//   }
// ];

import { FilterComparatorEnum, IFilter, LogicOperatorEnum } from "./@types";
import dayjs from "dayjs";
export interface IFilterMap {
  operator: LogicOperatorEnum | FilterComparatorEnum; //当前字段的操作符，对应jpa的logicOperator("AND"|"OR"|"NOT")和filterComparator("EQ","CONTAINS"...)
  targetField: string; //用于传递给后端接口的jpakey，对应jpa查询的fieldName字段
  validWhen: ((data: { [key: string]: any }) => boolean) | boolean; //用于判断该字段需要给后端吗？true为需要，false为不需要
  children?: IFilterMap[] | null; //当我们需要将queryForm中的某个字段拆解成多个字段传给后端时，需要加上children,此时的operator必须是LogicOperatorEnum(例如：queryForm中存在enterTime字段表示进场时间，但是传递给后端的查询条件需要转换成{"@classType": "comparator";fieldName: "enter",filterComparator: "EQ",ignoreCase: true;params: ["true"]}和{"@classType": "comparator";fieldName: "time",filterComparator: "EQ",ignoreCase: true;params: ["2022-02-22 00:00:00"]})
  directValue?: QueryFormValue; //directValue表示当前字段的值固定就是这个值，若该字段存在且值不是undefined，不会再去queryForm中查找(directValue的类型与queryForm[key]的值类型一致)，直接取这个值传递给后端，若不存在该字段或者值为undefined,则会按照formFieldName或者targetField去queryForm中查找值
  formFieldName?: string | string[]; //当需要传递给后端的targetField在queryForm中不存在的时候,需要给出可以关联到queryForm的字段（例如：后端需要的字段是belongDate,queryForm中只存在startDate和endDate，belongDate表示的含义是"@classType": "comparator";fieldName: "belongDate",filterComparator: "BETWEEN",ignoreCase: true;params: [startDate的值，endDate的值]}）
}
type ParamsList = string[] | boolean[] | number[] | Date[];
type BasicParamType = string | boolean | number | Date;
type QueryFormValue = BasicParamType | ParamsList;
export interface IQueryForm {
  [key: string]: QueryFormValue;
}

/**
 * 描述：获取jpa查询结构的最外层filter对象，
 * @param { LogicOperatorEnum } basicLogicOperator 该查询条件最外层的数据连接逻辑符，目前最外层只可能是logic结构，只需要确定连接符是什么
 * @param { IQueryForm } queryForm 当前需要查询的表单数据
 * @param { IFilterMap[] } filterRelationList 传递给后端查询最完整的过滤条件
 * @return {IFilter} 返回的是整个jpa的filter查询结构，例如：{filters:[xxx],logicOperator: "AND"},这里返回的是最外层的对象，只可能是逻辑链接的查询结构
  "@classType": "logic";}
 */
export const getFilterParams = (
  basicLogicOperator: LogicOperatorEnum,
  queryForm: IQueryForm,
  filterRelationList: IFilterMap[]
): IFilter | null => {
  /*
   * 判断最终的数组长度
   * 若数组长度大于0则返回{filters:[xxxx],logicOperator:basicLogicOperator, "@classType": "logic"}
   * 若长度为0，则返回null
   */
  const filterList = getSubFilterParams(queryForm, filterRelationList);
  if (filterList.length === 0) {
    return null;
  } else {
    return combineFilterItem("", basicLogicOperator, [], filterList);
  }
};

/**
 * 描述：返回查询条件中filters字段对应的值
 * @param { IQueryForm } queryForm 当前需要查询的表单数据
 * @param { IFilterMap[] } filterRelationList 传递给后端查询最完整的过滤条件
 * @return {IFilter[]} paramsList 对应为传递给后端的filters数组结构
 */
const getSubFilterParams = (
  queryForm: IQueryForm,
  filterRelationList: IFilterMap[]
): IFilter[] => {
  const paramsList: IFilter[] = []; //用来收集最终的filter数据
  filterRelationList.forEach((element) => {
    /*
     * 优先判断validWhen的类型
     * 如果是boolean类型直接就按照值判断，值是false则代表筛选条件不加这个字段,值是true则需要加入这个字段，需要进一步判断这个参数有效吗？
     * 若为函数，则需要执行这个函数,根据返回值判断true还是false
     */
    let valid;
    if (typeof element.validWhen === "boolean") {
      valid = element.validWhen;
    } else {
      valid = element.validWhen(queryForm);
    }
    // 此处说明这个字段被判定为是需要的，后续需要进一步判断这个字段对应的参数合理吗？合理则采纳，不合理则抛错或过滤
    if (valid) {
      const currentFilterItem = handleNeededFields(queryForm, element);
      if (currentFilterItem !== null) {
        paramsList.push(currentFilterItem);
      }
    }
  });
  return paramsList;
};

/**
 * 描述：当前字段是被需要的，需要对需要的字段进行进一步的判断，当前字段对应的值类型以及是有效值吗？根据不同的条件决定这个值需要加入返回给后端的查询条件吗？
 * @param { IQueryForm } queryForm 当前需要查询的表单数据
 * @param { IFilterMap } curFilterRelationItem 关联关系数组遍历中的当前关系元素
 * @return {IFilter | null } filterItem 将需要字段的当前jpa查询结构返回
 */
const handleNeededFields = (
  queryForm: IQueryForm,
  curFilterRelationItem: IFilterMap
): IFilter | null => {
  // 声明一个filterItem对象，最后返回这个对象;
  let filterItem: IFilter | null = null;
  // 判断当前的操作符类型不属于FilterComparatorEnum和LogicOperatorEnum中的类型，直接抛错（正常不会出现这个情况）
  if (
    !(curFilterRelationItem.operator in FilterComparatorEnum) &&
    !(curFilterRelationItem.operator in LogicOperatorEnum)
  ) {
    throw new Error(
      `当前operator操作符为${curFilterRelationItem.operator},不支持该操作符`
    );
    /*
     * 判断目前的操作符operator
     * 若是属于FilterComparatorEnum中的操作符,则属于比较运算符连接关系
     * 若是属于LogicOperatorEnum中的操作符，则属于逻辑运算连接符
     */
  } else if (curFilterRelationItem.operator in LogicOperatorEnum) {
    // 操作符为"OR""AND" "NOT",需要做复合筛选
    // 判断当前children存在
    if (!curFilterRelationItem.children) {
      throw new Error(
        `当前operator操作符为${
          curFilterRelationItem.operator
        },但是children的值不存在,当前的filterRelationItem为${JSON.stringify(
          curFilterRelationItem
        )}`
      );
    } else {
      if (curFilterRelationItem.children.length === 0) {
        //children的长度为0
        throw new Error(
          `当前operator操作符为${curFilterRelationItem.operator},但是children的长度为0`
        );
      } else {
        // 当前children存在，并且有依赖项，需要递归生成新的结构，只有当getFilterParams返回的list长度不为0时，才加进去
        const filtersResult = getSubFilterParams(
          queryForm,
          curFilterRelationItem.children as IFilterMap[]
        );
        if (filtersResult.length > 0) {
          filterItem = combineFilterItem(
            "",
            curFilterRelationItem.operator,
            [],
            filtersResult
          );
        }
      }
    }
  } else if (curFilterRelationItem.operator in FilterComparatorEnum) {
    // 判断当前targetField的类型，targetField因为作为参数字段，只可能是字符串类型
    if (typeof curFilterRelationItem.targetField !== "string") {
      throw new Error(
        `targetField不支持除了字符串以外的类型,targetField的值为：${
          curFilterRelationItem.targetField
        },当前element数据为${JSON.stringify(curFilterRelationItem)}`
      );
    } else {
      if (
        curFilterRelationItem.directValue !== undefined &&
        curFilterRelationItem.formFieldName !== undefined
      ) {
        //不允许同时directValue和formFieldName均有值，同时有则抛错
        throw new Error(
          `当前项的directValue：${
            curFilterRelationItem.directValue
          }和formFieldName：${
            curFilterRelationItem.formFieldName
          }不能同时有值,当前element数据为${JSON.stringify(
            curFilterRelationItem
          )}`
        );
      } else if (curFilterRelationItem.directValue !== undefined) {
        let params: string[] = [];
        if (curFilterRelationItem.directValue instanceof Array) {
          //directValue的值直接就是数组
          params = formatAndRemoveInvalidParams(
            curFilterRelationItem.directValue
          );
        } else {
          params = formatAndRemoveInvalidParams([
            curFilterRelationItem.directValue,
          ] as ParamsList);
        }
        // 此情况属于directValue有值，而formFieldName无值

        if (params.length > 0) {
          //这里判断主要是因为对于params数组移除不合理值时，最终结果可能会是空数组，最后需要根据这个值判断添不添加filters这一层
          filterItem = combineFilterItem(
            curFilterRelationItem.targetField,
            curFilterRelationItem.operator,
            params
          );
        }
      } else if (curFilterRelationItem.formFieldName !== undefined) {
        //此处是directValue无值，但是formFieldName有值
        //element.formFieldName只可能是字符串或者字符串类型的数组，表示需要传递给后端的字段取值来源于queryForm
        if (typeof curFilterRelationItem.formFieldName === "string") {
          const paramsList = getParamsList(
            queryForm,
            curFilterRelationItem,
            curFilterRelationItem.formFieldName
          ); //
          const params = formatAndRemoveInvalidParams(paramsList); //format之后都有可能会空数组
          if (params.length > 0) {
            //这里判断主要是因为对于params数组移除不合理值时，最终结果可能会是空数组，最后需要根据这个值判断添不添加filters这一层
            filterItem = combineFilterItem(
              curFilterRelationItem.targetField,
              curFilterRelationItem.operator,
              params
            );
          }
        } else if (curFilterRelationItem.formFieldName instanceof Array) {
          // 指定当前值需要从queryForm中的某个字段的值去取，说明当前字段可能queryForm没有，但是依赖于queryForm中的某两个值
          //formFieldName为数组，这说明传入后端的某一个字段需要依赖两个字段的值，并且为BETWEEN操作符
          // 若是数组类型则需要判断operator的类型是BETWEEN吗？是BETWEEN类型则需要对传入element.targetField对应字段的值进行判断，若左侧存在，右侧不存在为GT,左侧不存在，右侧存在则为LT,两个都存在才为BETWEEN
          if (curFilterRelationItem.operator === "BETWEEN") {
            // 判断当前数组的长度，只有当长度为2的时候才能够处理，否则抛错
            if (curFilterRelationItem.formFieldName.length !== 2) {
              throw new Error(
                `当前operator的类型为${curFilterRelationItem.operator},targetField类型为数组，但长度不为2,目前不支持这种情况`
              );
            } else {
              // 分别取索引为0和索引为1的值
              const startValue =
                queryForm[curFilterRelationItem.formFieldName[0]];
              const endValue =
                queryForm[curFilterRelationItem.formFieldName[1]];
              // 定义此情况的操作符
              let filterOperator: keyof typeof FilterComparatorEnum = "BETWEEN";
              if (!isValidParam(startValue)) {
                // 初始值为无效值
                if (!isValidParam(endValue)) {
                  // 当前字段依赖的两个值均为无效值，不应该传递给后端
                } else {
                  //初始值为无效值，结束值为有效值
                  filterOperator = "LE";
                }
              } else {
                //初始值为有效值
                if (!isValidParam(endValue)) {
                  //初始值为有效值，结束值为无效值
                  filterOperator = "GE";
                } else {
                  // 初始值有效且结束值也有效
                  filterOperator = "BETWEEN";
                }
              }
              const params = formatAndRemoveInvalidParams([
                startValue,
                endValue,
              ] as ParamsList);
              if (params.length > 0) {
                //这里判断主要是因为对于params数组移除不合理值时，最终结果可能会是空数组，最后需要根据这个值判断添不添加filters这一层
                filterItem = combineFilterItem(
                  curFilterRelationItem.targetField,
                  FilterComparatorEnum[filterOperator],
                  params
                );
              }
            }
          } else {
            throw new Error(
              `当前operator的类型为${curFilterRelationItem.operator},该operator类型不支持targetField为数组类型的情况`
            );
          }
        } else {
          throw new Error(
            `formFieldName的值${curFilterRelationItem.formFieldName}的类型只能为字符串或者数组，其他情况目前不支持`
          );
        }
      } else {
        //此情况属于directValue无值且formFieldName无值(则需要根据targetField字段去queryForm中找值了)
        const paramsList = getParamsList(
          queryForm,
          curFilterRelationItem,
          curFilterRelationItem.targetField
        );
        const params = formatAndRemoveInvalidParams(paramsList); //format之后都有可能会空数组
        if (params.length > 0) {
          //这里判断主要是因为对于params数组移除不合理值时，最终结果可能会是空数组，最后需要根据这个值判断添不添加filters这一层
          filterItem = combineFilterItem(
            curFilterRelationItem.targetField,
            curFilterRelationItem.operator,
            params
          );
        }
      }
    }
  }
  return filterItem;
};

/**
 * 描述：获取传递给后端JPA结构的params参数(未经过数组里值类型处理的params数组)
 * @param {IQueryForm} queryForm 当前需要查询的表单数据
 * @param {curFilterRelationItem} queryForm 当前需要查询的表单数据
 * @param {string} actualField 以该字段为准，去queryForm中找值
 * @return {string[] | boolean[] | number[] | Date[]} 返回类型仅为数字、字符串、日期、布尔类型的数组
 */
const getParamsList = (
  queryForm: IQueryForm,
  curFilterRelationItem: IFilterMap,
  actualField: string
): ParamsList => {
  // 声明一个paramsData,后续用于传入converParamsType方法中，将其他数据类型转成string[]的类型
  let paramsData: any[] = [];
  // 声明当前targetField对应的值
  let targetValue;
  /*
   * 判断当前curFilterRelationItem对应的targetField在queryForm中存在吗？
   * 在queryForm中存在，则targetFieldValue是根据targetField在queryForm中的取值
   */
  if (!(actualField in queryForm)) {
    // 当前过滤字段需要，但是queryForm不存在，则抛错
    throw new Error(
      `queryForm中不存在${actualField}字段,queryForm的数据为：${JSON.stringify(
        queryForm
      )}`
    );
  } else {
    targetValue = queryForm[actualField];
  }
  // 判断当前actualField对应的值类型
  // 若targetValue为字符串类型,需要内部判断trim()后的值存在？若存在加入paramsList不存在暂不处理
  if (
    typeof targetValue === "string" ||
    typeof targetValue === "boolean" ||
    typeof targetValue === "number" ||
    targetValue instanceof Date
  ) {
    paramsData = [targetValue]; //string[]|boolean[]|number[]
  } else if (targetValue instanceof Array) {
    // 当前actualField对应queryForm中的值为数组,操作符只可能是IN,如果是其他操作符抛错处理
    if (
      curFilterRelationItem.operator !== "IN" &&
      curFilterRelationItem.operator !== "BETWEEN"
    ) {
      throw new Error(
        `当前${actualField}对应queryForm的值为数组，但是操作符不为IN或BETWEEN,目前不支持这种方式的处理,${JSON.stringify(
          targetValue
        )}`
      );
    } else {
      paramsData = targetValue as any[];
    }
  } else {
    throw new Error(
      `当前${actualField}对应的queryForm值的类型不支持这种处理方式,${JSON.stringify(
        targetValue
      )}`
    );
  }
  return paramsData;
};

/**
 * 描述：根据逻辑运算符、参数、字段名称组成需要的过滤条件
 * @param {string} fieldName 传递给后端的字段名
 * @param {FilterComparatorEnum|LogicOperatorEnum} operator 比较运算符的链接符号
 * @param {string[]}params是已经通过convertType方法调用处理过后的类型了
 * @param {IFilter[]} filters 连接符为LogicOperatorEnum时，需要传递给后端的filters的结构
 * @return {IFilterMap} filterItem 当前组装好的每项查询结构
 */
const combineFilterItem = (
  fieldName: string,
  operator: FilterComparatorEnum | LogicOperatorEnum,
  params: string[],
  filters?: IFilter[]
): IFilter | null => {
  let filterItem: IFilter | null = null;
  if (!(operator in LogicOperatorEnum) && !(operator in FilterComparatorEnum)) {
    // 传递进来的操作符有误，不属于目前支持的运算符类型
    throw new Error(
      `当前使用的操作符为${operator},目前combineFilterItem方法不支持该操作符`
    );
  } else if (operator in LogicOperatorEnum && filters) {
    filterItem = {
      filters,
      logicOperator: operator as LogicOperatorEnum,
      "@classType": "logic",
    };
  } else if (operator in FilterComparatorEnum) {
    filterItem = {
      "@classType": "comparator",
      fieldName: fieldName,
      filterComparator: operator as FilterComparatorEnum,
      ignoreCase: true,
      params,
    };
  }
  return filterItem;
};

/**
 * 描述：该方法主要将数组中的无效值去除以及格式化内部数据为string类型。将数组内的无效值例如：undefined null去除，以及字符串转换后调用trim()方法为空的值去除，转换数据类型，统一最后返回的均为string类型
 * 因为formatAndRemoveInvalidParams方法是在所有逻辑判断之后，最终确定下来的params数组传参处理的。
 * 所以当前只需要做两件事：
 * 1、将日期格式的数据转换成固定格式的字符串类型，数字、布尔类型需要转成字符串类型值
 * 2、无效值：例如：undefined null 包括字符串调用trim()方法后为空字符串的值均认定为无效值，这些都不应该传递给后端，否则后端接口会报错
 * @param {ParamsList} ParamsList的类型为string[] | boolean[] | number[] | Date[] 传入值的类型仅为数字、字符串、日期、布尔类型的数组
 * @return {string[]} stringArr 最后转出来的结果是字符串类型的数组（因为调用后端jpa查询接口时,要求传递的必须是字符串类型）
 */
const formatAndRemoveInvalidParams = (data: ParamsList): string[] => {
  const stringArr: string[] = [];
  // 遍历data，逐一判断每一项的类型，
  data.forEach((item: string | number | boolean | Date) => {
    if (item instanceof Date) {
      //对时间类型进行统一处理(Date类型需要额外处理)//使用dayjs进行处理,统一将之间类型的数据通过format统一转换
      stringArr.push(dayjs(item).format("YYYY-MM-DD HH:mm:ss"));
    } else if (isValidParam(item)) {
      stringArr.push(String(item).trim()); //字符串、数字、布尔值都可以用这个方法转成字符串
    }
  });
  return stringArr;
};

/**
 * 描述：判断当前值有效吗？有效指的是值不为null或者undefined或者转成字符串类型后trim()调用不为空字符串。判断有效则返回true,无效则返回false
 * @param {undefined|null|number|string|Date|boolean} data 用于当前判断有效的数据
 * @return {boolean} valid 返回true表示该值有效，false表示该值无效
 */
const isValidParam = (data: any) => {
  let valid;
  const validTypeList = ["boolean", "number", "string", "undefined"];
  if (
    validTypeList.indexOf(typeof data) === -1 &&
    !(data instanceof Date) &&
    data !== null
  ) {
    // 传入的类型不属于undefined|null|number|string|Date|boolean中的任意一种
    throw new Error(
      `当前传入判断的值${JSON.stringify(
        data
      )}类型不是undefined|null|number|string|Date|boolean中的任意一种,不支持这种类型的处理`
    );
  } else {
    // 传入类型是非数组
    if (data === null || data === undefined || !String(data).trim()) {
      // 当前值被认定为无效值
      valid = false;
    } else {
      // 当前值被认定为有效值
      valid = true;
    }
  }
  return valid;
};
