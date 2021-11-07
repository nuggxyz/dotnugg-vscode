declare module 'vscode';

declare namespace NL.DotNugg {
    type RangeOf<T> = {
        value: T;
        token: ParsedToken;
        endToken?: ParsedToken;
    };

    type ParsedToken = {
        token: import('vscode-textmate').IToken;
        ruleStack: import('vscode-textmate').StackElement;
        line: import('vscode').TextLine;
        range: import('vscode').Range;
    };

    type Decoration = {
        range: import('vscode').Range;
        hoverMessage: string;
        type: DecorationType;
    };

    type BaseHelpers = 'topWidth' | 'topHeight' | 'eyeWidth' | 'mouthWidth' | 'midWidth' | 'midHeight' | 'botWidth' | 'botHeight';

    type DecorationType = 'expander' | 'vertical_expander';

    type Collection = {
        features: RangeOf<CollectionFeatures>;
        colors: RangeOf<Colors>;
    };

    type CollectionFeatures = Dictionary<RangeOf<CollectionFeature>>;
    type CollectionFeature = {
        name: RangeOf<string>;
        level: RangeOf<Level>;
        anchor: RangeOf<Anchor>;
        validRadii: RangeOf<RLUD<number>>;
    };

    type Document = {
        collection: RangeOf<Collection>;
        bases: RangeOf<Base>[];
        attributes: RangeOf<Attribute>[];
    };

    type Base = {
        colors: RangeOf<Colors>;
        filters: RangeOf<Filters>;
        data: RangeOf<Data>;
    };
    type Colors = Dictionary<RangeOf<Color>>;
    type Filters = Dictionary<RangeOf<Filter>>;

    type Attribute = {
        isDefault: boolean;
        feature: RangeOf<string>;
        colors: RangeOf<Colors>;
        versions: RangeOf<Versions>;
    };
    type Versions = Dictionary<RangeOf<Version>>;
    type Version = {
        name: RangeOf<string>;
        radii: RangeOf<RLUD<number>>;
        expanders: RangeOf<RLUD<number>>;
        anchor: RangeOf<Coordinate>;
        data: RangeOf<Data>;
    };
    type Coordinate = {
        x: RangeOf<number>;
        y: RangeOf<number>;
    };

    type RLUD<T> = {
        l: RangeOf<T>;
        r: RangeOf<T>;
        u: RangeOf<T>;
        d: RangeOf<T>;
    };

    type Color = {
        name: RangeOf<string>;
        level: RangeOf<Level>;
        rgba: RangeOf<RGBA>;
    };

    type Filter = {
        name: RangeOf<string>;
        level: RangeOf<Level>;
        type: RangeOf<number>;
        arg: RangeOf<number>;
    };

    type RGBA = `rgba(${_}${number}${_},${_}${number}${_},${_}${number}${_},${_}${number}${_})`;

    type _ = '';

    type Level = {
        direction: Operator;
        offset: number;
    };

    type Anchor = {
        key: number;
        direction: Operator;
        offset: number;
    };

    type Data = {
        matrix: RangeOf<DataRow>[];
    };

    type DataRow = RangeOf<Pixel>[];

    type PixelType = 'transparent' | 'filter' | 'color';

    type Pixel = {
        label: RangeOf<string>;
        type: RangeOf<PixelType>;
    };

    type Dictionary<T> = {
        [_: string]: T;
    };

    type Operator = '+' | '-';

    type UnparsedAnchor = `${number}${Operator}${number}`;

    type Split<S extends string, D extends string> = string extends S
        ? string[]
        : S extends ''
        ? []
        : S extends `${infer T}${D}${infer U}`
        ? [T, ...Split<U, D>]
        : [S];
}
