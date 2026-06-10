import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_shadows.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/store.dart';
import '../../state/cart_provider.dart';
import '../../state/store_provider.dart';
import '../../widgets/animated_press.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/premium_button.dart';
import '../../widgets/skeleton.dart';

class StoreSelectionScreen extends StatefulWidget {
  const StoreSelectionScreen({super.key});

  @override
  State<StoreSelectionScreen> createState() => _StoreSelectionScreenState();
}

class _StoreSelectionScreenState extends State<StoreSelectionScreen> {
  bool _locating = false;
  final _searchCtrl = TextEditingController();
  double? _lat;
  double? _lng;
  List<dynamic> _suggestions = [];
  bool _showSuggestions = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _searchCtrl.text = 'SW1A 2AA';
    _lat = 51.5034;
    _lng = -0.1276;
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) {
    if (val.trim().length < 3) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
      return;
    }
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      try {
        final url = Uri.parse(
          'https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent('$val, UK')}&countrycodes=gb&format=json&addressdetails=1&limit=5',
        );
        final res = await Dio().getUri(url, options: Options(headers: {
          'User-Agent': 'DailyGrocerMobile/1.0',
        }));
        if (res.statusCode == 200) {
          setState(() {
            _suggestions = res.data as List<dynamic>;
            _showSuggestions = true;
          });
        }
      } catch (_) {}
    });
  }

  Future<void> _searchPostcode(String val) async {
    if (val.trim().isEmpty) return;
    setState(() {
      _locating = true;
    });
    try {
      final clean = val.replaceAll(RegExp(r'\s+'), '').toUpperCase();
      final url = Uri.parse('https://api.postcodes.io/postcodes/$clean');
      final res = await Dio().getUri(url);
      if (res.statusCode == 200) {
        final data = res.data;
        if (data != null && data['result'] != null) {
          setState(() {
            _lat = (data['result']['latitude'] as num).toDouble();
            _lng = (data['result']['longitude'] as num).toDouble();
            _searchCtrl.text = data['result']['postcode'] as String;
            _suggestions = [];
            _showSuggestions = false;
          });
          _toast('Located: ${data['result']['postcode']}');
        }
      } else {
        _toast('Please enter a valid UK postcode (e.g. SW1A 2AA)');
      }
    } catch (_) {
      _toast('Please enter a valid UK postcode (e.g. SW1A 2AA)');
    } finally {
      if (mounted) {
        setState(() {
          _locating = false;
        });
      }
    }
  }

  Future<void> _onNearMe() async {
    if (_locating) return;
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        _toast('Turn on location services to find nearby stores.');
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        _toast('Location permission permanently denied. Enable it in system settings.');
        return;
      }
      if (perm == LocationPermission.denied) {
        _toast('Location permission required to find nearby stores.');
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      String postcodeText = '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
      try {
        final url = Uri.parse('https://api.postcodes.io/postcodes?lon=${pos.longitude}&lat=${pos.latitude}');
        final res = await Dio().getUri(url);
        if (res.statusCode == 200) {
          final data = res.data;
          if (data != null && data['result'] != null && (data['result'] as List).isNotEmpty) {
            postcodeText = data['result'][0]['postcode'] as String;
          }
        }
      } catch (_) {}

      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _searchCtrl.text = postcodeText;
        _suggestions = [];
        _showSuggestions = false;
      });
      _toast('Sorted by distance from $postcodeText');
    } catch (e) {
      _toast("Couldn't get your location. Try again in a moment.");
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: const Duration(seconds: 3)),
    );
  }

  List<_StoreDecorator> _getProcessedStores(List<StoreLocation> rawStores) {
    final lat = _lat ?? 51.5034;
    final lng = _lng ?? -0.1276;

    final list = rawStores.map((s) {
      double dist = 0.5;
      if (s.lat != null && s.lng != null) {
        dist = Geolocator.distanceBetween(lat, lng, s.lat!, s.lng!) / 1609.344;
      }

      // Calculate dynamic delivery fee and deliverability
      String feeStr = '£1.99';
      double feeNum = 1.99;
      bool deliverable = true;

      if (dist <= 1.0) {
        feeStr = '£1.99';
        feeNum = 1.99;
      } else if (dist <= 2.0) {
        feeStr = '£2.99';
        feeNum = 2.99;
      } else if (dist <= 3.0) {
        feeStr = '£3.99';
        feeNum = 3.99;
      } else if (dist <= 4.0) {
        feeStr = '£4.99';
        feeNum = 4.99;
      } else if (dist <= 5.0) {
        feeStr = '£5.99';
        feeNum = 5.99;
      } else {
        feeStr = 'Out of range';
        feeNum = 0.0;
        deliverable = false;
      }

      return _StoreDecorator(
        store: s,
        distance: dist,
        deliveryFeeStr: feeStr,
        deliveryFeeNum: feeNum,
        isDeliverable: deliverable,
      );
    }).toList();

    // Sort: Deliverable stores first, then by distance
    list.sort((a, b) {
      if (a.isDeliverable && !b.isDeliverable) return -1;
      if (!a.isDeliverable && b.isDeliverable) return 1;
      return a.distance.compareTo(b.distance);
    });

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final provider = context.watch<StoreProvider>();
    final isFirstSelection = !provider.hasStore;
    final canGoBack = Navigator.of(context).canPop();

    final decorated = _getProcessedStores(provider.all);
    final openStores = decorated.where((s) => s.store.isOpen && s.isDeliverable).toList();
    final closedStores = decorated.where((s) => !s.store.isOpen && s.isDeliverable).toList();
    final undeliverableStores = decorated.where((s) => !s.isDeliverable).toList();

    return PopScope(
      canPop: canGoBack,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: SafeArea(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Main content Column
              Column(
                children: [
                  // Logo Header Strip
                  Container(
                    height: 56,
                    width: double.infinity,
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(bottom: BorderSide(color: scheme.outlineVariant)),
                    ),
                    child: Row(
                      children: [
                        if (canGoBack) ...[
                          IconButton(
                            icon: Icon(Icons.arrow_back_rounded, color: scheme.onSurface),
                            onPressed: () => Navigator.of(context).maybePop(),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Image.asset(
                          'assets/logo_playful.png',
                          height: 32,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => Text(
                            'Daily Grocer',
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: scheme.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Search Row Container
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(AppSpacing.base),
                    child: _SearchRow(
                      controller: _searchCtrl,
                      locating: _locating,
                      onChanged: _onSearchChanged,
                      onSubmitted: _searchPostcode,
                      onNearMe: _onNearMe,
                    ),
                  ),
                  const Divider(height: 1, thickness: 1),

                  // Stores List
                  Expanded(
                    child: provider.isLoading && provider.all.isEmpty
                        ? const Center(child: CircularProgressIndicator())
                        : decorated.isEmpty
                            ? const Center(
                                child: Text(
                                  'No stores found near your location.',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                              )
                            : ListView(
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.all(AppSpacing.base),
                                children: [
                                  // Open Stores
                                  if (openStores.isNotEmpty) ...[
                                    _sectionHeader(
                                      icon: Icons.pedal_bike_rounded,
                                      iconColor: const Color(0xFF005EB8),
                                      title: 'Stores for delivery',
                                      theme: theme,
                                    ),
                                    const SizedBox(height: 12),
                                    ...openStores.map((d) => _buildCard(d, isFirstSelection, provider)),
                                    const SizedBox(height: 16),
                                  ],

                                  // Closed Stores
                                  if (closedStores.isNotEmpty) ...[
                                    _sectionHeader(
                                      icon: Icons.access_time_rounded,
                                      iconColor: AppColors.red500,
                                      title: 'Closed Stores',
                                      theme: theme,
                                    ),
                                    const SizedBox(height: 12),
                                    ...closedStores.map((d) => _buildCard(d, isFirstSelection, provider)),
                                    const SizedBox(height: 16),
                                  ],

                                  // Undeliverable Stores
                                  if (undeliverableStores.isNotEmpty) ...[
                                    _sectionHeader(
                                      icon: Icons.place_outlined,
                                      iconColor: scheme.outline,
                                      title: 'Out of Delivery Range',
                                      theme: theme,
                                    ),
                                    const SizedBox(height: 12),
                                    ...undeliverableStores.map((d) => _buildCard(d, isFirstSelection, provider)),
                                    const SizedBox(height: 16),
                                  ],
                                ],
                              ),
                  ),
                ],
              ),

              // Floating suggestions list overlay drawn on top of everything
              if (_suggestions.isNotEmpty && _showSuggestions)
                Positioned(
                  top: 56 + 68, // Header height (56) + Search container height (16*2 padding + 36 height)
                  left: 16,
                  right: 16,
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.white,
                    child: Container(
                      constraints: const BoxConstraints(maxHeight: 220),
                      decoration: BoxDecoration(
                        border: Border.all(color: scheme.outlineVariant),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: _suggestions.length,
                        itemBuilder: (context, idx) {
                          final item = _suggestions[idx];
                          final addr = item['address'] ?? {};
                          final parts = <String>[];
                          if (addr['road'] != null) parts.add(addr['road'] as String);
                          if (addr['suburb'] != null) parts.add(addr['suburb'] as String);
                          if (addr['city'] != null || addr['town'] != null || addr['village'] != null) {
                            parts.add((addr['city'] ?? addr['town'] ?? addr['village']) as String);
                          }
                          if (addr['postcode'] != null) parts.add(addr['postcode'] as String);
                          final label = parts.isNotEmpty ? parts.join(', ') : (item['display_name'] as String? ?? '');

                          return ListTile(
                            leading: const Icon(Icons.place_outlined, color: Color(0xFF005EB8), size: 16),
                            title: Text(
                              label,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            dense: true,
                            onTap: () {
                              final lat = double.tryParse(item['lat'] ?? '');
                              final lng = double.tryParse(item['lon'] ?? '');
                              if (lat != null && lng != null) {
                                setState(() {
                                  _lat = lat;
                                  _lng = lng;
                                  _searchCtrl.text = label;
                                  _suggestions = [];
                                  _showSuggestions = false;
                                });
                              }
                            },
                          );
                        },
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }


  Widget _sectionHeader({
    required IconData icon,
    required Color iconColor,
    required String title,
    required ThemeData theme,
  }) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
            fontSize: 16,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _buildCard(_StoreDecorator d, bool isFirstSelection, StoreProvider provider) {
    final s = d.store;
    final selected = !isFirstSelection && s.id == provider.selected!.id;
    final isDeliverable = d.isDeliverable;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: _StoreCard(
        store: s,
        selected: selected,
        distance: d.distance,
        deliveryFeeStr: d.deliveryFeeStr,
        isDeliverable: isDeliverable,
        onTap: () async {
          if (!s.isOpen || !isDeliverable) return;
          HapticFeedback.selectionClick();
          final cart = context.read<CartProvider>();
          final navigator = Navigator.of(context);
          final switching = !isFirstSelection && s.id != provider.selected!.id;
          if (switching && cart.items.isNotEmpty) {
            final confirmed = await _confirmStoreSwitch(context, s.name);
            if (confirmed != true) return;
            cart.clear();
          }
          provider.select(s);
          navigator.pushNamedAndRemoveUntil(AppRouter.shell, (_) => false);
        },
      ),
    );
  }
}

class _SearchRow extends StatelessWidget {
  const _SearchRow({
    required this.controller,
    required this.locating,
    required this.onChanged,
    required this.onSubmitted,
    required this.onNearMe,
  });
  final TextEditingController controller;
  final bool locating;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onNearMe;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: scheme.outlineVariant),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        children: [
          Icon(Icons.search_rounded, color: scheme.outline, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: onSubmitted,
              textInputAction: TextInputAction.search,
              style: theme.textTheme.bodyLarge,
              decoration: InputDecoration(
                hintText: 'Enter UK postcode or street address',
                hintStyle: theme.textTheme.bodyMedium?.copyWith(color: scheme.outline),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),
          const SizedBox(width: 8),
          AnimatedPress(
            onTap: locating ? null : onNearMe,
            child: Container(
              height: 36,
              width: 36,
              decoration: BoxDecoration(
                color: const Color(0xFF005EB8).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              alignment: Alignment.center,
              child: locating
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(Color(0xFF005EB8)),
                      ),
                    )
                  : const Icon(Icons.my_location_rounded, size: 18, color: Color(0xFF005EB8)),
            ),
          ),
        ],
      ),
    );
  }
}

class _StoreCard extends StatelessWidget {
  const _StoreCard({
    required this.store,
    required this.selected,
    required this.distance,
    required this.deliveryFeeStr,
    required this.isDeliverable,
    required this.onTap,
  });

  final StoreLocation store;
  final bool selected;
  final double distance;
  final String deliveryFeeStr;
  final bool isDeliverable;
  final VoidCallback onTap;

  Widget _logo(String name) {
    final n = name.toLowerCase();
    if (n.contains('family shopper')) {
      return Image.asset('assets/family_shopper.webp', fit: BoxFit.contain);
    }
    if (n.contains('go local')) {
      return Image.asset('assets/golocal.png', fit: BoxFit.contain);
    }
    if (n.contains('premier')) {
      return Image.asset('assets/premier.png', fit: BoxFit.contain);
    }
    if (n.contains('stocksfield')) {
      return Image.asset('assets/Stocksfield.png', fit: BoxFit.contain);
    }
    return Container(
      color: Colors.blue.shade50,
      alignment: Alignment.center,
      child: Text(
        name.isNotEmpty ? name.substring(0, 1) : 'S',
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF005EB8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final active = store.isOpen && isDeliverable;

    return AnimatedPress(
      onTap: active ? onTap : null,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.base),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
          boxShadow: AppShadows.soft(context),
        ),
        child: Opacity(
          opacity: active ? 1.0 : 0.9,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo image on left
              Container(
                height: 110,
                width: 110,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: scheme.outlineVariant),
                ),
                padding: const EdgeInsets.all(8),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: ColorFiltered(
                    colorFilter: active
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                        : const ColorFilter.mode(Colors.grey, BlendMode.saturation),
                    child: _logo(store.name),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // Details & action button on right
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      store.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: scheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),

                    // 2x2 grid
                    Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 14,
                                color: store.isOpen ? const Color(0xFF005EB8) : AppColors.red500,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  store.isOpen ? '25 to 40 mins' : 'We are closed.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: store.isOpen ? scheme.onSurfaceVariant : AppColors.red500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.place_outlined, size: 14, color: Color(0xFF005EB8)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '${distance.toStringAsFixed(2)} miles',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.receipt_long_outlined, size: 14, color: Color(0xFF64748B)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Min £${store.minOrderValue.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: scheme.onSurfaceVariant,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Row(
                            children: [
                              Icon(
                                Icons.local_shipping_outlined,
                                size: 14,
                                color: isDeliverable ? const Color(0xFF64748B) : AppColors.red500,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  isDeliverable ? deliveryFeeStr : 'Out of range',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isDeliverable ? scheme.onSurfaceVariant : AppColors.red500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Action button
                    Container(
                      width: double.infinity,
                      height: 38,
                      decoration: BoxDecoration(
                        color: active ? const Color(0xFF005EB8) : const Color(0xFF1E293B).withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        !isDeliverable
                            ? 'DELIVERY NOT AVAILABLE'
                            : store.isOpen
                                ? 'DELIVER TO ME'
                                : 'VIEW STORE',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StoreDecorator {
  final StoreLocation store;
  final double distance;
  final String deliveryFeeStr;
  final double deliveryFeeNum;
  final bool isDeliverable;

  const _StoreDecorator({
    required this.store,
    required this.distance,
    required this.deliveryFeeStr,
    required this.deliveryFeeNum,
    required this.isDeliverable,
  });
}

Future<bool?> _confirmStoreSwitch(BuildContext context, String storeName) {
  final theme = Theme.of(context);
  return showDialog<bool>(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          boxShadow: AppShadows.elevated(context),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Switch store?', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Your basket has items from your current store. '
              'Switching to $storeName will empty it.',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: PremiumButton(
                    label: 'Keep current',
                    variant: PremiumButtonVariant.ghost,
                    onPressed: () => Navigator.of(ctx).pop(false),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: PremiumButton(
                    label: 'Switch & clear',
                    variant: PremiumButtonVariant.accent,
                    onPressed: () => Navigator.of(ctx).pop(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}
