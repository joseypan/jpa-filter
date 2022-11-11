import { IFilterMap } from "./../src/index";
import { getFilterParams } from "../src/index";
import { describe, test, expect } from "vitest";
import { FilterComparatorEnum, LogicOperatorEnum } from "../src/@types";
describe("getFilterParams", () => {
  test("test getFilterParams basic use", () => {
    const basicQueryInfo = {
      deviceName: "deviceNo1",
      age: 12,
      isValid: false,
      date: new Date("2022-10-30 00:00:00"),
    };
    const filterMap = [
      {
        operator: FilterComparatorEnum.CONTAINS,
        targetField: "deviceName",
        validWhen: true,
        children: null,
      },
      {
        operator: FilterComparatorEnum.EQ,
        targetField: "age",
        validWhen: true,
        children: null,
      },
      {
        operator: FilterComparatorEnum.EQ,
        targetField: "isValid",
        validWhen: true,
        children: null,
      },
      {
        operator: FilterComparatorEnum.LE,
        targetField: "date",
        validWhen: true,
        children: null,
      },
    ];
    const resultData = {
      logicOperator: LogicOperatorEnum.AND,
      "@classType": "logic",
      filters: [
        {
          "@classType": "comparator",
          fieldName: "deviceName",
          filterComparator: FilterComparatorEnum.CONTAINS,
          ignoreCase: true,
          params: ["deviceNo1"],
        },
        {
          "@classType": "comparator",
          fieldName: "age",
          filterComparator: FilterComparatorEnum.EQ,
          ignoreCase: true,
          params: ["12"],
        },
        {
          "@classType": "comparator",
          fieldName: "isValid",
          filterComparator: FilterComparatorEnum.EQ,
          ignoreCase: true,
          params: ["false"],
        },
        {
          "@classType": "comparator",
          fieldName: "date",
          filterComparator: FilterComparatorEnum.LE,
          ignoreCase: true,
          params: ["2022-10-30 00:00:00"],
        },
      ],
    };
    expect(
      getFilterParams(LogicOperatorEnum.AND, basicQueryInfo, filterMap)
    ).toEqual(resultData);
  });

  test("validWhen field supports expression", () => {
    const queryForm = {
      name: "josey",
    };
    const filterMap: IFilterMap[] = [
      {
        operator: FilterComparatorEnum.EQ,
        targetField: "name",
        validWhen: (data) => {
          return data.name === "josey";
        },
      },
    ];
    const resultData = {
      logicOperator: LogicOperatorEnum.AND,
      "@classType": "logic",
      filters: [
        {
          "@classType": "comparator",
          fieldName: "name",
          filterComparator: FilterComparatorEnum.EQ,
          ignoreCase: true,
          params: ["josey"],
        },
      ],
    };
    expect(
      getFilterParams(LogicOperatorEnum.AND, queryForm, filterMap)
    ).toEqual(resultData);
  });

  test("remove item when validWhen equal false", () => {
    const queryForm = {
      name: "josey",
    };
    const filterMap: IFilterMap[] = [
      {
        operator: FilterComparatorEnum.EQ,
        targetField: "name",
        validWhen: false,
      },
    ];
    expect(
      getFilterParams(LogicOperatorEnum.AND, queryForm, filterMap)
    ).toEqual(null);
  });
});
