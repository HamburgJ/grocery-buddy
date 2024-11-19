from price_parser import parse_price_text, parse_pre_price_text, parse_value

def run_price_text_tests():
    test_cases = [
        # Basic unit tests - all non-weight units should be "each"
        ("lb.", ("pound", None, False)),
        ("/lb", ("pound", None, False)), 
        ("ea.", ("each", None, False)),
        ("/ea.", ("each", None, False)),
        ("/100g", ("100_gram", None, False)),
        ("/100G", ("100_gram", None, False)),
        ("100 g", ("100_gram", None, False)),
        ("/box", ("each", None, False)),  # Changed to each
        ("/Box", ("each", None, False)),  # Changed to each
        ("/case", ("each", None, False)),  # Changed to each
        ("/pkg", ("each", None, False)),  # Changed to each
        ("/Pk", ("each", None, False)),   # Changed to each
        ("/BAG", ("each", None, False)),  # Changed to each
        ("/basket", ("each", None, False)),  # Changed to each
        ("/LB OR EACH", ("pound", None, True)),  # Now multi-item
        ("ea./lb", ("each", None, True)),  # Now multi-item
        ("/ea/lb.", ("each", None, True)),  # Now multi-item
        ("lb/ea.", ("pound", None, True)),  # Now multi-item
        ("/100", ('100_gram', None, False)),
        ("355ml", ('each', None, False)), # common /each weights
        ("12oz", ('each', None, False)), # common /each weights
        ("2L", ('each', None, False)), # common /each weights
        
        
        # Price with units
        ("or $5.78 ea", ("each", None, False)),
        ("or 1.39/Ea", ("each", None, False)),
        ("OR 2.88/EA", ("each", None, False)),
        ("OR $2.29 each", ("each", None, False)),
        ("2.67 each", ("each", None, False)),
        ("-$6.99 ea", ("each", None, True)),
        ("/ $7.27 /Ea", ("each", None, True)),
        ("or 50¢ ea.", ("each", None, False)),
        ("/$22.87/Ea", ("each", None, True)),
        ("-$44.87/Ea", ("each", None, True)),
        ("OR 7.14 EACH", ("each", None, False)),
        
        # Pound prices - weight conversions aren't multi-item
        ("/Lb 3.48/kg", ("pound", None, False)),
        ("/LB. 1/KG.", ("pound", None, False)),
        ("/lb $26.61 /KG", ("pound", None, False)),
        ("LB 8.55/kg", ("pound", None, False)),
        ("LB 9.9/kg", ("pound", None, False)),
        ("/KG, $1.99/lb.", ("kilogram", None, False)),
        ("kg., $1.99/lb.", ("kilogram", None, False)),
        ("/lb or each", ("pound", None, True)),
        ("/lb or 4.99/kg or each", ("pound", None, True)),  # Now multi-item
        
        # Quantity patterns
        ("less than 2 $4.49 ea.", ("each", 2.0, False)),
        ("LESS THAN 2 PAY $4.99 ea.", ("each", 2.0, False)),
        ("less than 3 $4.99 ea.", ("each", 3.0, False)),
        ("LESS THAN 3 PAY $1.49 ea.", ("each", 3.0, False)),
        ("less than 4 $2.29 ea.", ("each", 4.0, False)),
        ("less than 8 $0.79 ea.", ("each", 8.0, False)),

        ("/3.97/Ea", ('each', None, True)), # multi-item, giving multiple each prices
        ("- $24.00", ('each', None, True)), # giving a high range for a price range of multiple items
        ("or 4.58 to 5.28 each", ('each', None, True)), # giving a range for a price range of multiple items
        
        # Complex cases - price ranges are multi-item
        ("or $14.77 to $16.27 each", ("each", None, True)),
        ("or $3.38, $3.88, $4.88 /Ea", ("each", None, True)),
        ("or 5.38, 7.88/Ea", ("each", None, True)),
        ("or 1.59,2.19/Ea", ("each", None, True)),
        
        # Edge cases
        ("", ("each", None, None)),
        ("*", ("each", None, None)),
        ("* Each", ("each", None, False)), 
        ("OFF", ("each", None, None)),
        ("EACH", ("each", None, False)),
        ("with Scene+ Card", ("each", None, None)),
        ("- $35.00", ("each", None, True)),
        ("¹ down % APR", ("each", None, None)),
        ("ea when you buy 5 or more", ("each", None, False)),
        ("EA OR BUY 1 $3.49", ("each", None, False)),
        ("12.99/pkg", ("each", None, True)),  # multi item as a new price given
        
        # french format
        ("ou 7,49$ l'unité", ("each", None, False)),
        ("la douzaine", ("each", 12, False)),
        ("or 6,99$ ea.", ("each", None, False)),
        ("/a", ('each', None, False)),

        # tricky cases
        ("ea./kg.", ('each', None, True)),  # Period after both units
        ("/ea./kg.", ('each', None, True)),  # Leading slash and periods
        ("ea/lb/kg", ('each', None, True)),  # Three units
        ("ea./lb./kg.", ('each', None, True)),  # Three units with periods
        ("ea . / lb", ('each', None, True)),  # Spaces around dots and slashes
        ("ea/ / lb", ('each', None, True)),  # Double slashes
        ("ea//lb", ('each', None, True)),  # Double slashes no space
        ("EAch/LB", ('each', None, True)),  # Mixed case
        ("Each./LB.", ('each', None, True)),  # Mixed case with periods
        ("/pound", ('pound', None, False)),  # Non-standard unit names
        ("unité/lb", ('each', None, True)),  # French/English mixing
        ("ea/kilogramme", ('each', None, True)),  # French/English mixing
        ("l'unité/kg", ('each', None, True)),  # French/English mixing
        ("ea./lb 4.99/kg", ('each', None, True)),  # Multiple prices with unit combinations
        ("ea. 4.99/lb or 6.99/kg", ('each', None, True)),  # Multiple prices with unit combinations
        ("2kg/ea.", ('each', None, True)),  # Edge cases with numbers
        ("ea-lb", ('each', None, True)),  # Unusual separators
        ("ea:lb", ('each', None, True)),  # Unusual separators
        ("ea;lb", ('each', None, True)),  # Unusual separators
        ("ea../lb..", ('each', None, True)),  # Multiple periods
        ("ea.../lb...", ('each', None, True)),  # Multiple periods
        ("/ea/", ('each', None, False)),  # Empty components
        ("//ea", ('each', None, False)),  # Empty components
        ("lb//", ('pound', None, False)),  # Empty components
        ("", ('each', None, None)),
        (None, ('each', None, None)),
    ]
    
    passed = 0
    failed = 0
    warnings = 0
    for input_text, expected in test_cases:
        result = parse_price_text(input_text)
        # Check first two items match exactly
        if result[:2] == expected[:2]:
            if result[2] == expected[2]:
                print(f"✓ Input: {str(input_text):<25} Output: {result} [CORRECT]")
                passed += 1
            else:
                print(f"⚠ Input: {str(input_text):<25} Output: {result} [WARNING - Expected multi flag: {expected[2]}]")
                warnings += 1
        else:
            print(f"✗ Input: {str(input_text):<25} Output: {result} [INCORRECT - Expected: {expected}]")
            failed += 1
            
    print(f"\nTest Summary:")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Warnings: {warnings}")
    print(f"Total:  {passed + failed + warnings}")

def run_pre_price_text_tests():
    tests = [
            ("2 PACK", 2),
            ("ONE FOR", 1),
            ("8 FOR", 8),
            ("5 for", 5),
            ("3/", 3),
            ("2/", 2),
            ("4/", 4),
            ("Any 3 for", 3),
            ("", 1),
            ("BUY 2 OR MORE", 1),  # Should not match as it's not at start
            ("random text", 1),
            ("TWO FOR", 2),
            ("THREE FOR", 3),
            ("BUY 3 FOR", 3),
            ("BUY 1 at $1.99 BUY 2 OR MORE", 1),
            ("FIVE PACK", 5),
            ("reg.", 1),
            ("ONLY", 1),
            ("2", 2),
            ("ALWAYS 2/", 2),
            ("ALWAYS 3/", 3),
            ("ALWAYS 4/", 4),
            ("ALWAYS 5/", 5),
            ("members only price", 1),
            ("prix membre", 1),
            ("Starting At:", 1),
            ("À PARTIR DE", 1),
            ("3 for", 3),
            ("Always 2/", 2),
            ("BUY 2 OR MORE", 1),
            ("tous les jours", 1),
            ("from", 1),
            ("2 PACK", 2),
            ("Always", 1),
            ("8 FOR", 8),
            ("BUY 3 OR MORE", 1),
            ("PC Optimum Members-Only Price", 1),
            ("your choice", 1),
            ("4/", 4),
            ("ONE FOR", 1),
            ("Member Price", 1),
            ("2 for", 2),
            ("Members-Only Price", 1),
            ("ALWAYS", 1),
            ("BUY 1 at $5.49 BUY 2 or more", 1),
            ("6/", 6),
            ("PC Optimum member price", 1),
            ("reg.", 1),
            ("BUY 1 at $3.99 BUY 2 or more", 1),
            ("4 FOR", 4),
            ("ONLY", 1),
            ("BUY 1 at $2.99 BUY 2 or more", 1),
            ("8/", 8),
            ("2", 2),
            ("2 FOR", 2),
            ("2/", 2),
            ("5 PACK", 5),
            ("only", 1),
            ("BUY 1 at $4.49 BUY 2 or more", 1),
            ("AU CHOIX", 1),
            ("NOW", 1),
            ("Starting at", 1),
            ("PC Optimum Members-Only Price**", 1),
            ("Any 3 for", 3),
            ("BUY 1 at $1.69 BUY 4 OR MORE", 1),
            ("LOCKED & LOW", 1),
            ("5 for", 5),
            ("PC Optimum Members-Only*", 1),
            ("BUY 1 at $1.99 BUY 2 or more", 1),
            ("BUY 1 at $2.49 BUY 3 or more", 1),
            ("FROM", 1),
            ("3/", 3),
            ("Starting At", 1),
            ("Scene+ Member Price", 1),
            ("YOUR PICK!", 1),
            ("Members Only Price", 1),
            ("3 FOR", 3),
            ("Scene+ Member Pricing", 1),
            ("4 for", 4),
            (None, 1),
            ("", 1),
        ]
    passed = 0
    failed = 0
    for input_text, expected in tests:
        result = parse_pre_price_text(input_text)
        if result == expected:
            print(f"✓ Input: {str(input_text):<25} Output: {result} [CORRECT]")
            passed += 1
        else:
            print(f"✗ Input: {str(input_text):<25} Output: {result} [INCORRECT - Expected: {expected}]")
            failed += 1
            
    print(f"\nTest Summary:")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Total:  {passed + failed}")

def run_parse_value_tests():
    tests = [
        (None, "4.77", None, (10004.77, 'each', None, None)),
        (None, "4.49", "/100g", (20.37, '100_gram', None, False)),
    ]
    passed = 0
    failed = 0
    for input_text, price, price_text, expected in tests:
        result = parse_value(input_text, price, price_text)
        if result == expected:
            print(f"✓ Input: {str(input_text):<25} Output: {result} [CORRECT]")
            passed += 1
        else:
            print(f"✗ Input: {str(input_text):<25} Output: {result} [INCORRECT - Expected: {expected}]")
            failed += 1
            
    print(f"\nTest Summary:")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Total:  {passed + failed}")

if __name__ == "__main__":
    #run_price_text_tests()
    #run_pre_price_text_tests()
    run_parse_value_tests()
