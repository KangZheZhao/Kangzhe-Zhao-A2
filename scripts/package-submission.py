"""Build the three A3 source archives without local credentials or dependencies."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
from datetime import datetime, timezone
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'.git', '.local', 'node_modules', '__pycache__', 'archive', 'delivery', 'output'}


def linked(path):
    info = path.lstat()
    return path.is_symlink() or bool(getattr(info, 'st_file_attributes', 0) &
                                    getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400))


def collect(folder, extensions):
    source = ROOT / folder
    if not source.is_dir() or linked(source):
        raise ValueError('Missing source directory or unexpected link: ' + folder)
    found = []
    for current, directories, names in os.walk(source):
        directories[:] = sorted(name for name in directories if name not in SKIP)
        for name in directories:
            if linked(Path(current) / name):
                raise ValueError('Source directory contains a link.')
        for name in sorted(names):
            file = Path(current) / name
            if name == '.env' or file.suffix.lower() not in extensions:
                continue
            if linked(file) or not file.resolve().is_relative_to(ROOT):
                raise ValueError('Source file leaves the project directory.')
            found.append(file)
    return found


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--username', default='username')
    parser.add_argument('--runtime-only', action='store_true',
                        help='Package only the application, its assets and the fresh-import schema')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', args.username):
        parser.error('Username must contain letters, digits, underscores or hyphens.')
    output = ROOT / 'delivery'
    output.mkdir(exist_ok=True)
    if linked(output):
        raise ValueError('The delivery directory must not be a link.')

    api_files = collect('api', {'.js', '.mjs', '.cjs', '.json', '.sql'})
    if args.runtime_only:
        api_files = [file for file in api_files
                     if not {'test', 'migrations'}.intersection(file.relative_to(ROOT / 'api').parts)]
    else:
        api_files += (collect('scripts', {'.js', '.mjs', '.py', '.ps1'}) + collect('docs', {'.md'}) +
                      collect('database', {'.sql'}) + collect('verification', {'.md', '.json', '.jpg'}) +
                      collect('reference', {'.md', '.pdf', '.docx'}) + collect('submission', {'.txt'}) +
                      [ROOT / 'README.md', ROOT / '交付说明.md'])
    api_files.append(ROOT / 'api/.env.example')
    groups = {
        'clientside': collect('clientside', {'.html', '.css', '.js', '.jpg', '.ttf', '.txt', '.md'}),
        'adminside': collect('adminside', {'.html', '.css', '.js'}),
        'api': api_files,
    }
    # Check for this local account's password without printing or storing it.
    local_env = ROOT / 'api/.env'
    secret = None
    if local_env.exists():
        for line in local_env.read_text(encoding='utf-8-sig').splitlines():
            if line.startswith('DB_PASSWORD='):
                secret = line.partition('=')[2].strip().strip('"\'').encode()
    version = json.loads((ROOT / 'api/package.json').read_text(encoding='utf-8'))['version']
    manifest = {'version': version, 'builtAt': datetime.now(timezone.utc).isoformat(),
                'username': args.username, 'profile': 'runtime' if args.runtime_only else 'source', 'packages': []}
    for group, files in groups.items():
        archive = output / f'{args.username}A3-{group}.zip'
        entries = []
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
            for file in sorted(set(files)):
                if linked(file) or not file.resolve().is_relative_to(ROOT):
                    raise ValueError('Unexpected linked source file.')
                relative = file.relative_to(ROOT).as_posix()
                if any(part in SKIP for part in file.relative_to(ROOT).parts) or file.name == '.env':
                    raise ValueError('Excluded file selected for packaging.')
                data = file.read_bytes()
                if secret and len(secret) >= 8 and secret in data:
                    raise ValueError('Local password found in a selected file; package was not completed.')
                bundle.writestr(relative, data)
                entries.append({'path': relative, 'sha256': digest(data), 'bytes': len(data)})
        with zipfile.ZipFile(archive) as bundle:
            if bundle.testzip():
                raise ValueError('Archive integrity check failed.')
        manifest['packages'].append({'file': archive.name, 'sha256': digest(archive.read_bytes()),
                                     'bytes': archive.stat().st_size, 'files': len(entries), 'entries': entries})
        print(f'{archive.name}: {len(entries)} files; ZIP integrity passed')
    if not args.runtime_only:
        for source, name in [(ROOT / 'database/charityevents_db.sql', 'charityevents_db.sql'),
                             (ROOT / 'reference/Peer Evaluation form.docx', 'Peer Evaluation form.docx'),
                             (ROOT / '交付说明.md', '交付说明.md')]:
            shutil.copyfile(source, output / name)
    manifest_name = f'{args.username}A3-manifest.json' if args.runtime_only else 'manifest.json'
    (output / manifest_name).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
