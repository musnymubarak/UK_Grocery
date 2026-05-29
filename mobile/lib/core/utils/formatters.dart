String formatGBP(num value) {
  final s = value.toStringAsFixed(2);
  return '£$s';
}

String pluralize(int n, String singular, [String? plural]) {
  if (n == 1) return '$n $singular';
  return '$n ${plural ?? '${singular}s'}';
}
