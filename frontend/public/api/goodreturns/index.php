<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Content-Type: text/html; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$url = "https://www.goodreturns.in/gold-rates/";
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n" .
                    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n"
    ]
];

$context = stream_context_create($opts);
$html = @file_get_contents($url, false, $context);

if ($html !== false && strlen($html) > 500) {
    echo $html;
} else {
    http_response_code(502);
    echo "Failed to fetch live rates from GoodReturns";
}
?>
