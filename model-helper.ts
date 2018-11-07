function enumerable(value: boolean) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = value;
  };
}

const DEFAULT_DATE_FORMAT: string = 'YYYYMMDD';

// decorators
// 1. classField
export function classField(classFunc: any) {
  return function (parentClass: any, fieldName: string) {
    ModelHelper.insertFieldToClassMap(parentClass, fieldName, classFunc);
  };
}

// 2. dateField
export function dateField(dateFormat: string = ModelHelper.defaultDateFormat) {
  return function (parentClass: any, fieldName: string) {
    ModelHelper.insertFieldToDateFormatMap(parentClass, fieldName, dateFormat);
  };
}

// 3. uiField
export function uiField(dateFormat: string = ModelHelper.defaultDateFormat) {
  return function (parentClass: any, fieldName: string) {
    ModelHelper.insertUiField(parentClass, fieldName);
  };
}

// data container class ---
class ClassDesk {
  fieldToClassMap: { [field: string]: any } = {};
  fieldToDateFormatMap: { [field: string]: string } = {};
  uiFields: string[] = [];
}

// ModelHelper
export class ModelHelper {

  // static ---
  private static classesDesk: { [parentClassName: string]: ClassDesk } = {};

  // 1. class ---
  static getFieldToClassMap(parentClass: any) {
    return ModelHelper._getClassesDesk(parentClass).fieldToClassMap;
  }
  static insertFieldToClassMap(parentClass: any, fieldName: string, classFunc: any) {
    ModelHelper.getFieldToClassMap(parentClass)[fieldName] = classFunc;
  }

  // 2. date ---
  private static _defaultDateFormat: string;
  static getFieldToDateFormatMap(parentClass: any) {
    return ModelHelper._getClassesDesk(parentClass).fieldToDateFormatMap;
  }
  static insertFieldToDateFormatMap(parentClass: any, fieldName: string, dateFormat: string) {
    ModelHelper.getFieldToDateFormatMap(parentClass)[fieldName] = dateFormat;
  }

  // interface to set default date format
  static get defaultDateFormat(): string {
    return ModelHelper._defaultDateFormat || DEFAULT_DATE_FORMAT;
  }

  static set defaultDateFormat(dateFormat: string) {
    ModelHelper._defaultDateFormat = dateFormat;
  }


  // 3. UI fields - no serialization
  static getUiFields(parentClass: any) {
    return ModelHelper._getClassesDesk(parentClass).uiFields;
  }
  static insertUiField(parentClass: any, fieldName: string) {
    return ModelHelper.getUiFields(parentClass).push(fieldName);
  }


  private static _getClassesDesk(parentClass: Object) {
    const parentClassName = parentClass.constructor.name;
    let d: ClassDesk = ModelHelper.classesDesk[parentClassName];
    if (!d) {
      d = ModelHelper.classesDesk[parentClassName] = new ClassDesk();
    }
    return d;
  }
  // END of static ---

  // deserializer
  constructor(data: any) {
    // 1. build children objects
    const mapC = ModelHelper.getFieldToClassMap(this);
    Object.keys(mapC).forEach(key => data[key] = new mapC[key](data[key]));

    // 2. build date objects
    const mapD = ModelHelper.getFieldToDateFormatMap(this);
    Object.keys(mapD).forEach(key => data[key] = moment(data[key], mapD[key]).toDate());

    // 3. copy JSON data to object
    Object.assign(this, data);
  }


  // serializer: 1. date 2. ui fields
  @enumerable(false)
  toJSON?() {

    const datesMap = ModelHelper.getFieldToDateFormatMap(this);
    const dateKeys = Object.keys(datesMap);

    const uiFieldsArr = ModelHelper.getUiFields(this);

    if (!dateKeys.length && !uiFieldsArr.length)
      return this;

    const obj = Object.assign({}, this);

    // TODO: test it
    // 1. dates - serialize date objects
    dateKeys.forEach(key => obj[key] = moment(obj[key]).format(datesMap[key]));

    // 2. ui fields - delete ui fields
    uiFieldsArr.forEach((uiFieldName) => delete obj[uiFieldName]);

    return obj;
  }

  @enumerable(false)
  copyOf?(srcObj: any) {
    Object.assign(this, srcObj);
  }

  @enumerable(false)
  deepCopyOf?(srcObj: any) {
    Object.assign(this, JSON.parse(JSON.stringify(srcObj)));
  }

}

