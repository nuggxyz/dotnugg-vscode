const TWO_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<s19>\s*)(?<assignment2>\S*)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>{)(?<s3>\s*)(?<c10>\S+)(?<n1>\s*)(?<c19>:)(?<s4>\s*)(?<c2>\S+)(?<n2>\s*)(?<c15>,)(?<s5>\s*)(?<c12>\S+)(?<n6>\s*)(?<c20>:)(?<s7>\s*)(?<c11>\S+)(?<s22>\s*)(?<c14>})(?<n20>\s*)/,
	'gd',
);
const THREE_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>{)(?<s3>\s*)(?<c10>\S+)(?<n1>\s*)(?<c19>:)(?<s4>\s*)(?<c2>\S+)(?<n2>\s*)(?<c15>,)(?<s9>\s*)(?<c17>\S+)(?<n7>\s*)(?<c28>:)(?<s10>\s*)(?<c21>\S+)(?<n12>\s*)(?<c22>,)(?<s11>\s*)(?<c25>\S+)(?<n9>\s*)(?<c23>:)(?<s13>\s*)(?<c14>\S+)(?<s14>\s*)(?<c24>})(?<n20>\s*)/,
	'gd',
);
const FOUR_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>{)(?<s3>\s*)(?<c10>\S+)(?<n1>\s*)(?<c19>:)(?<s4>\s*)(?<c2>\S+)(?<n2>\s*)(?<c15>,)(?<s5>\s*)(?<c12>\S+)(?<n6>\s*)(?<c20>:)(?<s7>\s*)(?<c11>\S+)(?<n22>\s*)(?<c16>,)(?<s9>\s*)(?<c17>\S+)(?<n7>\s*)(?<c28>:)(?<s10>\s*)(?<c21>\S+)(?<n12>\s*)(?<c22>,)(?<s11>\s*)(?<c25>.+)(?<n9>\s*)(?<c23>:)(?<s13>\s*)(?<c14>\S+)(?<s14>\s*)(?<c24>})(?<n20>\s*)/,
	'gd',
);

const ONE_ONE_FOUR_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>{)(?<s3>\s*)(?<c10>\S+)(?<n1>\s*)(?<c19>:)(?<s4>\s*)(?<c2>\S+)(?<n2>\s*)(?<c15>,)(?<s9>\s*)(?<c17>\S+)(?<n7>\s*)(?<c28>:)(?<s10>\s*)(?<c21>\S+)(?<n12>\s*)(?<c22>,)(?<s11>\s*)(?<c25>\S+)(?<n9>\s*)(?<c23>:)(?<s13>\s*)(?<c60>{)(?<s30>\s*)(?<c100>\S+)(?<n10>\s*)(?<c190>:)(?<s40>\s*)(?<c20>\S+)(?<n20>\s*)(?<c1500>,)(?<s5>\s*)(?<c12>\S+)(?<n6>\s*)(?<c200>:)(?<s7>\s*)(?<c11>\S+)(?<n22>\s*)(?<c16>,)(?<s900>\s*)(?<c1700>\S+)(?<n700>\s*)(?<c2800>:)(?<s1000>\s*)(?<c210>\S+)(?<n120>\s*)(?<c220>,)(?<s110>\s*)(?<c250>\S+)(?<n90>\s*)(?<c230>:)(?<s130>\s*)(?<c140>\S+)(?<s14>\s*)(?<c24>})(?<s140>\s*)(?<c240>})(?<n200>\s*)/,
	'gd',
);

const ONE_FOUR_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>{)(?<s3>\s*)(?<c17>\S+)(?<n7>\s*)(?<c28>:)(?<s10>\s*)(?<c21>\S+)(?<n12>\s*)(?<c22>,)(?<s11>\s*)(?<c25>\S+)(?<n9>\s*)(?<c23>:)(?<s13>\s*)(?<c60>{)(?<s30>\s*)(?<c100>\S+)(?<n10>\s*)(?<c190>:)(?<s40>\s*)(?<c20>\S+)(?<n20>\s*)(?<c1500>,)(?<s5>\s*)(?<c12>\S+)(?<n6>\s*)(?<c200>:)(?<s7>\s*)(?<c11>\S+)(?<n22>\s*)(?<c16>,)(?<s900>\s*)(?<c1700>\S+)(?<n700>\s*)(?<c2800>:)(?<s1000>\s*)(?<c210>\S+)(?<n120>\s*)(?<c220>,)(?<s110>\s*)(?<c250>\S+)(?<n90>\s*)(?<c230>:)(?<s130>\s*)(?<c140>\S+)(?<s14>\s*)(?<c24>})(?<s140>\s*)(?<c240>})(?<n200>\s*)/,
	'gd',
);
const ASSIGNMENT = new RegExp(/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>.*)/, 'gd');
const INLINE_ASSIGNMENT = new RegExp(/(?<s1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c6>\S+)(?<s7>\s*)/, 'gd');
const ONE_ARG_ASSIGNMENT = new RegExp(
	/(?<t1>\s*)(?<assignment>\S+)(?<assignment_spacer>\s*)(?<c9>:=)(?<s6>\s*)(?<c14>\S+)(?<n20>\s*)/,
	'gd',
);
const HEADER = new RegExp(/(?<t1>\s*)(\S+)(?<s1>\s*):=(?<s2>\s*)(\{)/, 'gd');
const FOOTER = new RegExp(/(?<t1>\s*)(\})(?<n1>\s*)/, 'gd');
const NIL = new RegExp(/(?<n1>\s*)/, 'gd');
const ANY_NONSPACE_WITH_TAB = new RegExp(/(?<t1>\s*)(?<ns1>.*)/, 'gd');

export const REGEX = {
	FOUR_ARG_ASSIGNMENT,
	THREE_ARG_ASSIGNMENT,
	TWO_ARG_ASSIGNMENT,
	ASSIGNMENT,
	INLINE_ASSIGNMENT,
	ONE_ARG_ASSIGNMENT,
	HEADER,
	FOOTER,
	NIL,
	ANY_NONSPACE_WITH_TAB,
	ONE_ONE_FOUR_ARG_ASSIGNMENT,
	ONE_FOUR_ARG_ASSIGNMENT,
};
