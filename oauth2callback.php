<?php
require_once __DIR__.'/vendor/autoload.php';

session_start();

$client = new Google\Client();
$client->setAuthConfig(realpath(__DIR__ . '/../key/cred.json'));
$client->setRedirectUri('https://voiceforhealth.online/oauth2callback.php');
$client->addScope(Google_Service_Drive::DRIVE_FILE);
if (! isset($_GET['code'])) {
  $auth_url = $client->createAuthUrl();
  header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));
} else {
  $client->authenticate($_GET['code']);
  $_SESSION['access_token'] = $client->getAccessToken();
  $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . '/';
  header('Location: ' . filter_var($redirect_uri, FILTER_SANITIZE_URL));
}