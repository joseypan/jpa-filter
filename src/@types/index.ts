/**
 * @FileDescription: 结合list接口查询的JPA接口类型定义
 * @Author: 潘旭敏
 * @Date: 2022-01-27
 * @LastEditors: 潘旭敏
 * @LastEditTime: 2022-01-27 15:36
 */
export enum FilterComparatorEnum {
  /** 等于 */
  EQ = "EQ",
  /** 不等于 */
  NE = "NE",
  /** 对于日期类型，就是晚于指定时间 */
  GT = "GT",
  /** 对于日期类型，就是早于指定时间 */
  LT = "LT",
  /** 对于日期类型，就是等于或晚于指定时间 */
  GE = "GE",
  /** 对于日期类型，就是等于或早于指定时间 */
  LE = "LE",
  /** 在两个值之间，包括2个值 */
  BETWEEN = "BETWEEN",
  /** 等于列表中的任一值 */
  IN = "IN",
  /** 不等于列表中所有值 */
  NOTIN = "NOTIN",
  /** 是null */
  ISNULL = "ISNULL",
  /** 非null */
  // NOTNULL,
  /** 是null */
  // ISEMPTY,
  /** 非null */
  // NOTEMPTY,
  /** 如下只对字符串类型有效 */
  /** 以...开始 */
  STARTWITH = "STARTWITH",
  /** 包含 */
  CONTAINS = "CONTAINS",
  /** 以...结尾 */
  ENDWITH = "ENDWITH",
}
export enum LogicOperatorEnum {
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
}
interface ILogicFilter {
  filters: IFilter[];
  logicOperator: LogicOperatorEnum; //逻辑操作符，且、或、非
  "@classType": "logic";
}
interface IComparatorFilter {
  "@classType": "comparator";
  fieldName: string;
  filterComparator: FilterComparatorEnum;
  ignoreCase: boolean;
  params: string[];
}

// 传入JPA结构的filter类型
export type IFilter = ILogicFilter | IComparatorFilter;

// 排序字段
export interface ISortFieldByServer {
  field: string; //可以是返回列表数据当中的任意字段
  ascending: boolean;
}

// 整体的JPA请求类型
export interface IRequestListParam {
  filter?: IFilter | null;
  pageParam?: {
    pageNo: number; //页码编号从0开始
    pageSize: number; //每页的数量范围为1及1以上
  };
  sortFields?: ISortFieldByServer[];
}

// JPA类型接口返回数据结构类型
export interface IListResponse<T> {
  pageNo: number;
  pageSize: number;
  queryRequest: IRequestListParam;
  results: Array<T>;
  totalCount: number;
}
export type ParamsList = string[] | boolean[] | number[] | Date[];
export type BasicParamType = string | boolean | number | Date;
export type QueryFormValue = BasicParamType | ParamsList;
export interface IQueryForm {
  [key: string]: QueryFormValue;
}
