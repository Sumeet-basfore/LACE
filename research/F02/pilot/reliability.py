import subprocess, pathlib, shutil, tempfile, json
repo=pathlib.Path("repo")
fixes=pathlib.Path("fixes")
for arm, fix in [("baseline","bank_fixed.py"),("candidate","bank_fixed.py")]:
    print(f"\n{arm} 3x T04 reliability")
    passes=0
    for i in range(3):
        td=pathlib.Path(tempfile.mkdtemp())
        for p in (repo).iterdir():
            if p.name in (".git","__pycache__"): continue
            if p.is_dir(): shutil.copytree(p, td/p.name, dirs_exist_ok=True)
            else: shutil.copy(p, td/p.name)
        # apply bank fix
        shutil.copy(fixes/fix, td/"bank.py")
        # also need other files? For isolated T04, others remain buggy so check only bank test via custom runner?
        # We'll run only test_T04 via inline
        r=subprocess.run(["python3","-c","import tests_reference; tests_reference.test_T04(); print('PASS')"], cwd=td, capture_output=True, text=True)
        ok=r.returncode==0
        print(f"  trial {i+1}: {'PASS' if ok else 'FAIL'}")
        if ok: passes+=1
    print(f"  => {passes}/3")
