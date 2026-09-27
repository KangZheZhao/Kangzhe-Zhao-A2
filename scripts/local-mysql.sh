#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
mysql_base="$project_root/.local/mysql"
mysql_data="$project_root/.local/mysql-data"
mysql_socket="$project_root/.local/mysql.sock"
mysql_pid="$project_root/.local/mysql.pid"
mysql_log="$project_root/.local/mysql-server.log"

is_running() {
  [ -f "$mysql_pid" ] && kill -0 "$(cat "$mysql_pid")" 2>/dev/null
}

case "${1:-status}" in
  start)
    if [ ! -x "$mysql_base/bin/mysqld" ] || [ ! -d "$mysql_data" ]; then
      echo "Local MySQL files are missing. Install MySQL or use another local server." >&2
      exit 1
    fi
    if is_running; then
      echo "Local MySQL is already running."
      exit 0
    fi
    "$mysql_base/bin/mysqld" --no-defaults \
      --basedir="$mysql_base" --datadir="$mysql_data" \
      --socket="$mysql_socket" --pid-file="$mysql_pid" \
      --log-error="$mysql_log" --port=3306 \
      --bind-address=127.0.0.1 --daemonize
    echo "Local MySQL started on 127.0.0.1:3306."
    ;;
  stop)
    if is_running; then
      kill -TERM "$(cat "$mysql_pid")"
      echo "Local MySQL shutdown requested."
    else
      echo "Local MySQL is not running."
    fi
    ;;
  status)
    if is_running; then
      echo "Local MySQL is running."
    else
      echo "Local MySQL is not running."
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 2
    ;;
esac
